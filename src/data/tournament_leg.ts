import { Entity, PrimaryGeneratedColumn, Unique, Column, JoinColumn, ManyToOne } from 'typeorm'
import { Tournament } from './tournament'

@Entity( { name: 'tournament_legs' } )
@Unique( [ 'tournament', 'index' ] )
export class TournamentLeg {

    @PrimaryGeneratedColumn()
    public id: number

    @ManyToOne( type => Tournament, tournament => tournament.legs, { onDelete: 'CASCADE' } )
    @JoinColumn( { name: 'tournament_id' } )
    public tournament: Tournament

    @Column( { default: 0 } )
    public index: number

    @Column( { default: 0 } )
    public stage_start_index: number

    @Column( { default: 0 } )
    public stage_end_index: number

    @Column( { type: 'datetime' } )
    public start_date_time: Date

    @Column( { type: 'datetime' } )
    public end_date_time: Date
}
