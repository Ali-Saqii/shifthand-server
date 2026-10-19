 'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('signups', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      shift_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'shifts', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addConstraint('signups', {
      fields: ['shift_id', 'user_id'],
      type: 'unique',
      name: 'signups_shift_user_unique'
    });
    await queryInterface.addIndex('signups', ['shift_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('signups');
  }
};