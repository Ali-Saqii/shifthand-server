 'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shifts', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      event_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      ends_at: { type: Sequelize.DATE, allowNull: false },
      capacity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('shifts', ['event_id', 'starts_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('shifts');
  }
};