export {}

declare global {
    interface DriverData {
        id: string,
        name: string,
        country: string,
        country_code: string,
    }

    interface TournamentListElement {
        id: string,
        driver_id: string,
        is_online: boolean,
        is_offline: boolean
    }

    interface TournamentData {
        license: string,
        start_date_time: Date,
        end_date_time: Date,
        description: string,
        difficulty: string,
        finished: number,
        started: number,
        drivers: DriverData[],
        cant_resume: boolean,
        password_protected: boolean,
        save_replay: boolean,
        require_stage_comments: boolean,

        cars: string[],
        physics: string,

        legs: TournamentLegData[]
    }

    interface StageData {
        stage_index: number,
        stage_name: string,
        stage_name_original: string,

        pos: number,
        did_not_finish: boolean,
        driver_name: string,
        driver_country: string,

        car_name: string,
        car_id: string,

        time_split_1: number,
        time_split_2: number,
        time_split_3: number,
        time_difference: number,
        time_penalty: number,
        finish_date_time: Date,
        restarts: number,
        track_progress: number,
        weather_id: number,
        tyres_id: number,
        damage_id: number,

        comment: string
    }

    interface TournamentLegData {
        index: number,
        stage_start_index: number,
        stage_end_index: number,
        start_date_time: Date,
        end_date_time: Date
    }
}