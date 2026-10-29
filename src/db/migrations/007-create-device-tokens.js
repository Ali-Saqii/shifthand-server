 'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('device_tokens', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      user_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      token: { type: Sequelize.STRING(512), allowNull: false, unique: true },
      platform: { type: Sequelize.ENUM('ios', 'android'), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('device_tokens', ['user_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('device_tokens');
  }
};