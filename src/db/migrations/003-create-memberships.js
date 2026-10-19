 'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('memberships', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      organization_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      role: { type: Sequelize.ENUM('owner', 'admin', 'member'), allowNull: false, defaultValue: 'member' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addConstraint('memberships', {
      fields: ['organization_id', 'user_id'],
      type: 'unique',
      name: 'memberships_organization_user_unique'
    });
    await queryInterface.addIndex('memberships', ['user_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('memberships');
  }
};