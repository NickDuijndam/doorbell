import { Column, DataType, DeletedAt, Model, Table, Unique, UpdatedAt } from 'sequelize-typescript';
import { PushSubscription } from 'web-push';

@Table({ paranoid: false })
export default class Subscription extends Model<Subscription> {

	@Unique
	@Column(DataType.JSON)
	subscription: PushSubscription;

	@UpdatedAt
	updatedAt: Date;

	@DeletedAt
	deletedAt: Date;

}
