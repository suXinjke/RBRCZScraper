import * as fs from 'fs'
import * as path from 'path'
import { pastTournaments, stageData, tournamentPage } from './scrapper'
import { addTournament } from './database'
import * as zlib from 'zlib'

const OUTPUT_DIR = path.join( __dirname, 'output' )
const TOURNAMENTS_DIR = path.join( OUTPUT_DIR, 'tournaments' )
const TOURNAMENTS_AUX_DIR = path.join( OUTPUT_DIR, 'tournaments_aux_info' )
const STAGE_RESULTS_DIR = path.join( OUTPUT_DIR, 'stage_results' )

function randomNumber( min, max ) {
    return Math.random() * ( max - min ) + min
}

async function sleep( seconds: number ) {
    return new Promise( ( res ) => {
        setTimeout( () => res(), seconds * 1000 )
    } )
}

async function scrapData() {

    [ OUTPUT_DIR, TOURNAMENTS_DIR, TOURNAMENTS_AUX_DIR, STAGE_RESULTS_DIR ].forEach( dirPath => {
        if ( !fs.existsSync( dirPath ) ) {
            fs.mkdirSync( dirPath )
        }
    } )

    let page = Number( fs.readFileSync( './page', { flag: 'a+' } ).toString() || '1' )

    let tournamentListElements: TournamentListElement[] = []
    let currentId = ''
    do {
        try {
            console.log( `Scraping page ${page}` )

            tournamentListElements = pastTournaments.parse( await pastTournaments.fetch( page ) )

            for ( const element of tournamentListElements ) {
                const { id } = element

                fs.promises.writeFile( path.join( TOURNAMENTS_AUX_DIR, `${id}.json` ), JSON.stringify( element ) )

                currentId = element.id

                const [ tournamentHtml, stagesCsv ] = await Promise.all( [
                    tournamentPage.fetch( id ),
                    stageData.fetch( id )
                ] )

                fs.promises.writeFile( path.join( TOURNAMENTS_DIR, `${id}.htmlz` ), zlib.gzipSync( tournamentHtml ) )
                fs.promises.writeFile( path.join( STAGE_RESULTS_DIR, `${id}.csvz` ), zlib.gzipSync( stagesCsv ) )

                console.log( `Finished tournament ${id}` )

                await sleep( randomNumber( 2, 3 ) )
            }

            console.log( `Finished page ${page}` )
            page++
            fs.writeFileSync( './page', page.toString() )
        } catch ( err ) {
            console.error( err )
            console.error( `failed to parse tournament ${currentId}` )
            tournamentListElements = []
        }
    } while ( tournamentListElements.length > 0 )
}

async function parse() {

    const compressedTournamentFiles = fs.readdirSync( TOURNAMENTS_DIR )
    for ( const compressedTournamentFile of compressedTournamentFiles ) {
        const tournament_id = path.basename( compressedTournamentFile, '.htmlz' )

        const element = JSON.parse( fs.readFileSync( path.join( TOURNAMENTS_AUX_DIR, `${tournament_id}.json` ) ).toString() ) as TournamentListElement
        const tournamentHtml = zlib.unzipSync( fs.readFileSync( path.join( TOURNAMENTS_DIR, `${tournament_id}.htmlz` ) ) ).toString()
        const stagesCsv = zlib.unzipSync( fs.readFileSync( path.join( STAGE_RESULTS_DIR, `${tournament_id}.csvz` ) ) ).toString()

        const tournament = tournamentPage.parse( tournamentHtml )
        const stages = stageData.parse( stagesCsv )

        await addTournament( element, tournament, stages )
    }
}

async function main() {
    await scrapData()
}

main()
