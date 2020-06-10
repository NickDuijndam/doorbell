module.exports = {
	up: async (query , sequelize) => {
		await query.createTable('subscriptions', {
			id: {
				type: sequelize.INTEGER,
				allowNull: false,
				primaryKey: true
			},
			subscription: {
				type: sequelize.JSON,
				allowNull: false,
				unique: true,
			},
			createdAt: {
				type: sequelize.DATE,
				allowNull: false
			},
			updatedAt: {
				type: sequelize.DATE,
				allowNull: false
			},
		})
	},
	down: async (query) => {
		await query.dropTable('subscriptions')
	}
}
