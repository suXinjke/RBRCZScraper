import { Entity, PrimaryColumn, Column, OneToMany, JoinTable } from 'typeorm'
import { TournamentLeg } from './tournament_leg'
import { Stage } from './stage'

@Entity( { name: 'tournaments' } )
export class Tournament {

    @PrimaryColumn()
    public id: string

    @Column( { default: '' } )
    public license: string

    @Column( { type: 'datetime' } )
    public start_date_time: Date

    @Column( { type: 'datetime' } )
    public end_date_time: Date

    @Column( { default: '' } )
    public description: string

    @Column( { default: '' } )
    public difficulty: string

    @Column( { default: 0 } )
    public finished: number

    @Column( { default: 0 } )
    public started: number

    @Column( { default: 0 } )
    public cant_resume: boolean

    @Column( { default: 0 } )
    public password_protected: boolean

    @Column( { default: 0 } )
    public save_replay: boolean

    @Column( { default: 0 } )
    public require_stage_comments: boolean

    @Column( { default: '' } )
    public physics: string

    @OneToMany( type => TournamentLeg, leg => leg.tournament )
    public legs: TournamentLeg[]

    @OneToMany( type => Stage, stage => stage.tournament )
    public stages: Stage[]
}
