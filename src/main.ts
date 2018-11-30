import * as fs from 'fs'
import { pastTournaments, stageData, tournamentPage } from './scrapper'
import { addTournament, tournamentExists } from './database'

function randomNumber( min, max ) {
    return Math.random() * ( max - min ) + min
}

async function sleep( seconds: number ) {
    return new Promise( ( res ) => {
        setTimeout( () => res(), seconds * 1000 )
    } )
}

async function doWork() {
    let page = Number( fs.readFileSync( './page', { flag: 'w+' } ).toString() || '1' )

    let ids: string[] = []
    let currentId = ''
    do {
        try {
            console.log( `Scraping page ${page}` )

            ids = pastTournaments.getTournamentIds( await pastTournaments.fetch( page ) )

            for ( const id of ids ) {
                currentId = id

                if ( await tournamentExists( id ) ) {
                    console.log( `tournament ${id} already exists` )
                    continue
                }

                const [ tournamentHtml, stagesCsv ] = await Promise.all( [
                    tournamentPage.fetch( id ),
                    stageData.fetch( id )
                ] )

                const tournament = tournamentPage.parse( tournamentHtml )
                const stages = stageData.parse( stagesCsv )

                await addTournament( id, tournament, stages )
                console.log( `Finished tournament ${id}` )

                await sleep( randomNumber( 1, 5 ) )
            }

            page++
            fs.writeFileSync( './page', page.toString() )
            console.log( `Finished page ${page}` )
        } catch ( err ) {
            console.error( err )
            console.error( `failed to parse tournament ${currentId}` )
        }
    } while ( ids.length > 0 )
}

async function main() {
    await doWork()
}

main()
