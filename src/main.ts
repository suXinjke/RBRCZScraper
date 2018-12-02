import * as fs from 'fs'
import { pastTournaments, stageData, tournamentPage } from './scrapper'
import { addTournament, tournamentExists, mergeDriverIdToTournament } from './database'

function randomNumber( min, max ) {
    return Math.random() * ( max - min ) + min
}

async function sleep( seconds: number ) {
    return new Promise( ( res ) => {
        setTimeout( () => res(), seconds * 1000 )
    } )
}

async function doWork() {
    let page = Number( fs.readFileSync( './page', { flag: 'a+' } ).toString() || '1' )

    let tournamentListElements: TournamentListElement[] = []
    let currentId = ''
    do {
        try {
            console.log( `Scraping page ${page}` )

            tournamentListElements = pastTournaments.parse( await pastTournaments.fetch( page ) )

            for ( const element of tournamentListElements ) {
                const { id, driver_id } = element
                currentId = element.id

                const existingTournament = await tournamentExists( id )
                if ( existingTournament ) {
                    console.log( `tournament ${id} already exists` )

                    if ( !existingTournament.driver_id ) {
                        await mergeDriverIdToTournament( element )
                        console.log( `tournament ${id} got updated with driver_id ${driver_id}` )
                    }

                    continue
                }

                const [ tournamentHtml, stagesCsv ] = await Promise.all( [
                    tournamentPage.fetch( id ),
                    stageData.fetch( id )
                ] )

                const tournament = tournamentPage.parse( tournamentHtml )
                const stages = stageData.parse( stagesCsv )

                await addTournament( element, tournament, stages )
                console.log( `Finished tournament ${id}` )

                await sleep( randomNumber( 1, 5 ) )
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

async function main() {
    await doWork()
}

main()
