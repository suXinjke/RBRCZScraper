import { Entity, PrimaryGeneratedColumn, Unique, Column, Index, JoinColumn, ManyToOne } from 'typeorm'
import { Driver } from './driver'
import { Tournament } from './tournament'

@Entity( { name: 'stages' } )
@Unique( [ 'tournament', 'driver', 'stage_index' ] )
export class Stage {

    @PrimaryGeneratedColumn()
    public id: number

    @ManyToOne( type => Tournament, tournament => tournament.stages, { onDelete: 'CASCADE' } )
    @JoinColumn( { name: 'tournament_id' } )
    public tournament: Tournament

    @Column( { default: 0 } )
    public stage_index: number

    @Column( { default: '' } )
    public stage_name: string

    @Column( { default: '' } )
    public stage_name_original: string

    @Column( { default: 0 } )
    public pos: number

    @Column( { default: 0 } )
    public did_not_finish: boolean

    @ManyToOne( type => Driver )
    @JoinColumn( { name: 'driver_id' } )
    public driver: Driver

    @Column( { default: 0 } )
    public car_id: number

    @Column( { type: 'real', default: 0 } )
    public time_split_1: number

    @Column( { type: 'real', default: 0 } )
    public time_split_2: number

    @Column( { type: 'real', default: 0 } )
    public time_split_3: number

    @Column( { type: 'real', default: 0 } )
    public time_difference: number

    @Column( { type: 'real', default: 0 } )
    public time_penalty: number

    @Column( { type: 'datetime' } )
    public finish_date_time: Date

    @Column( { default: 0 } )
    public restarts: number

    @Column( { type: 'real', default: 0 } )
    public track_progress: number

    @Column( { default: 0 } )
    public weather_id: number

    @Column( { default: 0 } )
    public tyres_id: number

    @Column( { default: 0 } )
    public damage_id: number

    @Column( { default: '' } )
    public comment: string
}
