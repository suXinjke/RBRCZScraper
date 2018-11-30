import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'

@Entity( { name: 'drivers' } )
export class Driver {

    @PrimaryColumn()
    public id: number

    @Column( { default: '', unique: true } )
    public name: string

    @Column( { default: '' } )
    public country: string

    @Column( { default: '' } )
    public country_code: string
}
