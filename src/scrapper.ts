import axios from 'axios'
import * as $ from 'cheerio'
import * as moment from 'moment'
import * as csv_parser from 'csv-parse/lib/sync'

const headers = {
    Cookie: 'lng=eng'
}

export const pastTournaments = {
    fetch: async ( page: number ) => {
        return ( await axios.get( `https://rbr.onlineracing.cz/index.php?setlng=eng&act=tourmntslst&page=${page}`, {
            headers
        } ) ).data as string
    },

    parse: ( html: string ) => {
        const dom = $.load( html )

        const tables = dom( 'center' ).filter( function( i, e ) {
            return $( this ).text().startsWith( 'Finished tournaments' )
        } ).next().children( 'tbody' )

        return tables.children().map( function( i, e ) {
            const row = $( this )
            const tournament_link = $( e.children[0].firstChild ).attr( 'href' )
            const driver_link = $( e.children[7].firstChild ).attr( 'href' )
            if ( !tournament_link || !driver_link ) {
                return
            }

            const listElement: TournamentListElement = {
                id: tournament_link.match( /torid=(.+)&?/ )[1],
                driver_id: driver_link.match( /u=(.+)&?/ )[1],
                is_online: row.children( 'td:nth-child(11)' ).children( 'img[title="Online tournament"]' ).length > 0,
                is_offline: row.children( 'td:nth-child(11)' ).children( 'img[title="Offline tournament"]' ).length > 0
            }

            return listElement
        } ).get() as TournamentListElement[]
    }
}

export const tournamentPage = {
    fetch: async ( id: string ) => {
        return ( await axios.get( `https://rbr.onlineracing.cz/index.php?act=tourmntsview&torid=${id}&setlng=eng`, {
            headers
        } ) ).data as string
    },

    parse: ( html: string ): TournamentData => {
        const dom = $.load( html )

        const table = dom( 'table' ).filter( function( i, e ) {
            const attrs = $( this ).attr()

            return attrs.width === '65%' &&
                attrs.align === 'center' &&
                attrs.cellspacing === '1' &&
                attrs.cellpadding === '1'
        } ).children( 'tbody' )

        const tableMappers = {
            'Required licences': ( element: Cheerio ) => {
                return element.text().trim()
            },
            'Date from': ( element: Cheerio ) => {
                return moment( element.text().trim(), 'h:mm DD.MM.YYYY' ).toDate()
            },
            'Date to': ( element: Cheerio ) => {
                return moment( element.text().trim(), 'h:mm DD.MM.YYYY' ).toDate()
            },
            'Tournament description': ( element: Cheerio ) => {
                return element.text().trim()
            },
            'Difficulty': ( element: Cheerio ) => {
                return element.text().trim()
            },
            'Finished / Started': ( element: Cheerio ) => {
                return element.text().trim()
            },
            'Entry list': ( element: Cheerio ) => {
                return element.children( 'span' ).children( 'a' ).map( function() {
                    const elem = $( this )
                    const flag = elem.prev()
                    const driver: DriverData = {
                        id: elem.attr( 'href' ).match( /u=(\d+)/ )[1],
                        name: elem.text(),
                        country: flag[0] && flag[0].name === 'img' ? flag.attr( 'title' ) : '',
                        country_code: flag[0] && flag[0].name === 'img' ? flag.attr( 'src' ).match( /\/(\w+)\.\w+$/ )[1] : ''
                    }

                    return driver
                } ).get()
            },
            'Physics': ( element: Cheerio ) => {
                return element.text().trim()
            },
            'Cant resume tournament': ( element: Cheerio ) => {
                return element.text().trim() === 'Yes' ? true : false
            },
            'Password protected': ( element: Cheerio ) => {
                return element.text().trim() === 'Yes' ? true : false
            },
            'Save replays': ( element: Cheerio ) => {
                return element.text().trim() === 'Yes' ? true : false
            },
            'Require stage comments': ( element: Cheerio ) => {
                return element.text().trim() === 'Yes' ? true : false
            },
            'Allowed modifications': ( element: Cheerio ) => {
                return element.children( 'span' ).children( 'a, span' ).map( function() {
                    return $( this ).text()
                } ).get()
            }
        }

        const data = table.children( 'tr' ).filter( function() {
            const header = $( this ).children( 'td:nth-child(1)' ).text().trim()
            return tableMappers[header] !== undefined
        } )
        .map( function() {
            const elem = $( this )
            const header = elem.children( 'td:nth-child(1)' ).text().trim()
            const rowData = elem.children( 'td:nth-child(2)' )

            return { header, data: tableMappers[header]( rowData ) }
        } ).get().reduce( ( prev, val ) => {
            return {
                ...prev,
                [val.header]: val.data
            }
        }, {} )

        const legs = dom( 'table' ).filter( function( i, e ) {
            const attrs = $( this ).attr()

            return attrs.width === '50%' &&
                attrs.align === 'center' &&
                attrs.class === 'block1'
        } ).children( 'tbody' ).children( 'tr' ).filter( ( i ) => {
            return i > 0
        } ).map( function() {
            const stuff = $( this ).children( 'td' ).children( 'span' )

            const stage_range = $( stuff[1] ).text().match( /(\d+)(?:\s*-\s*(\d+))?/ )
            const leg_time_format = 'DD.MM.YYYY h:mm'

            const stage_start_index = ( stage_range && stage_range[1] ) ? Number( stage_range[1] ) : 0
            const stage_end_index = ( stage_range && stage_range[2] ) ? Number( stage_range[2] ) : stage_start_index

            const leg: TournamentLegData = {
                index: Number( $( stuff[0] ).text() ),
                stage_start_index,
                stage_end_index,
                start_date_time: moment( $( stuff[2] ).text(), leg_time_format ).toDate(),
                end_date_time: moment( $( stuff[3] ).text(), leg_time_format ).toDate()
            }

            return leg
        } ).get()

        const modifications: string[] = data['Allowed modifications']
        const finished_started_string = data['Finished / Started'].match( /(\d+)\s+\/\s+(\d+)/ )

        const physics_mods = [
            'physic',
            'opravy',
            'snow mod',
            'snow france'
        ]

        return {
            license: data['Required licences'] as string,
            start_date_time: data['Date from'] as Date,
            end_date_time: data['Date to'] as Date,
            description: data['Tournament description'] as string,
            difficulty: data['Difficulty'] as string,
            finished: Number( finished_started_string[1] ),
            started: Number( finished_started_string[2] ),
            drivers: data['Entry list'],
            cant_resume: data['Cant resume tournament'] as boolean,
            password_protected: data['Password protected'] as boolean,
            save_replay: data['Save replays'] as boolean,
            require_stage_comments: data['Require stage comments'] as boolean,

            cars: modifications.filter( car => physics_mods.find( physic_mod => car.toLowerCase().includes( physic_mod ) ) === undefined ),
            physics: modifications.find( physic => physics_mods.find( physic_mod => physic.toLowerCase().includes( physic_mod ) ) !== undefined ),

            legs
        }
    }
}

export const stageData = {
    fetch: async ( id: string ) => {
        return ( await axios.get( `https://rbr.onlineracing.cz/tools.php?act=tour_stages_res_csv&torid=${id}` ) ).data as string
    },

    parse: ( csv: string ): StageData[] => {

        const data = csv
        .split( /\r?\n/ )
        .filter( ( line, index ) => {
            return index !== 0 && line.trim().length > 0 && !line.startsWith( 'Warning' )
        } )
        .map<StageData>( line => {
            const [
                pos,
                user_name, country,
                car, car_code,
                stage_pos, stagename,
                time1, time2, time3, timediff, penalty,
                finishtealtime,
                restarts,
                trackprogress,
                weathercode, tyrescode, damagecode,
                comment
            ] = csv_parser( line, {
                delimiter: ';'
            } )[0]

            const stage_name_matches = stagename.match( /(.*)\(([^)]+)\)$/ )

            return {
                stage_index: Number( stage_pos ),
                stage_name: stage_name_matches ? stage_name_matches[1].trim() : stagename,
                stage_name_original: stage_name_matches ? stage_name_matches[2].trim() : stagename,

                pos: pos === 'DNF' ? 0 : Number( pos ),
                did_not_finish: pos === 'DNF',
                driver_name: user_name,
                driver_country: country,

                car_name: car,
                car_id: car_code,

                time_split_1: Number( time1 ),
                time_split_2: Number( time2 ),
                time_split_3: Number( time3 ),
                time_difference: Number( timediff ),
                time_penalty: Number( penalty ),
                finish_date_time: new Date( Number( finishtealtime ) * 1000 ),
                restarts: Number( restarts ),
                track_progress: Number( trackprogress ),
                weather_id: Number( weathercode ),
                tyres_id: Number( tyrescode ),
                damage_id: Number( damagecode ),

                comment
            }
        } )

        return data
    }
}
