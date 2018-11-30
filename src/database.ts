import { Stage } from './data/stage'
import { Driver } from './data/driver'
import { Tournament } from './data/tournament'
import { TournamentLeg } from './data/tournament_leg'
import { createConnection, Connection } from 'typeorm'

let db: Connection

export async function tournamentExists( tournament_id: string ) {
    if ( !db ) {
        db = await createConnection()
    }

    const tournamentRepo = db.getRepository( Tournament )
    return Boolean( await tournamentRepo.findOne( tournament_id ) )
}

export async function addTournament( tournament_id: string, tournament: TournamentData, stages: StageData[] ) {
    if ( !db ) {
        db = await createConnection()
    }

    const driverRepo = db.getRepository( Driver )
    const tournamentRepo = db.getRepository( Tournament )
    const legRepo = db.getRepository( TournamentLeg )
    const stageRepo = db.getRepository( Stage )

    let tournamentRecord = await tournamentRepo.findOne( tournament_id )
    if ( tournamentRecord ) {
        console.log( `tournament ${tournament_id} already exists` )
        return
    }

    await db.transaction( async transaction => {

        const drivers = await driverRepo.findByIds( tournament.drivers.map( driver => Number( driver.id ) ) )
        const unexisting_drivers = tournament.drivers
            .filter( driver => drivers.find( existingDriver => Number( driver.id ) === existingDriver.id ) === undefined )
            .map( driver => {
                const { id, name, country, country_code } = driver

                return driverRepo.create( {
                    id: Number( id ),
                    name,
                    country,
                    country_code
                } )
            } )

        drivers.push( ...( await transaction.save( unexisting_drivers ) ) )

        {
            const {
                license,
                start_date_time,
                end_date_time,
                description,
                difficulty,
                finished,
                started,
                cant_resume,
                password_protected,
                save_replay,
                require_stage_comments,

                cars,
                physics,

                legs
            } = tournament

            tournamentRecord = await transaction.save( tournamentRepo.create( {
                id: tournament_id,

                license,
                start_date_time,
                end_date_time,
                description,
                difficulty,
                finished,
                started,
                cant_resume,
                password_protected,
                save_replay,
                require_stage_comments,

                physics,

                legs: legs.map( leg => legRepo.create( leg ) ),
                stages: []
            } ) )
        }

        await transaction.save( stages.map( stage => {
            const {
                stage_index,
                stage_name,
                stage_name_original,

                pos,
                did_not_finish,
                car_id,

                time_split_1,
                time_split_2,
                time_split_3,
                time_difference,
                time_penalty,
                finish_date_time,
                restarts,
                track_progress,
                weather_id,
                tyres_id,
                damage_id,

                comment
            } = stage

            return stageRepo.create( {
                tournament: tournamentRecord,

                stage_index,
                stage_name,
                stage_name_original,

                pos,
                did_not_finish,
                driver: drivers.find( driver => driver.name === stage.driver_name ),

                car_id: Number( car_id ),

                time_split_1,
                time_split_2,
                time_split_3,
                time_difference,
                time_penalty,
                finish_date_time,
                restarts,
                track_progress,
                weather_id,
                tyres_id,
                damage_id,

                comment
            } )
        } ) )

        await transaction.save( tournament.legs.map( leg => {
            const {
                index,
                stage_start_index,
                stage_end_index,
                start_date_time,
                end_date_time
            } = leg

            return legRepo.create( {
                index,
                stage_start_index,
                stage_end_index,
                start_date_time,
                end_date_time,
                tournament: tournamentRecord
            } )
        } ) )
    } )
}
