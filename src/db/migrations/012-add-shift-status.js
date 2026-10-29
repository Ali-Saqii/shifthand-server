'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shifts', 'status', {
      type: Sequelize.ENUM('active', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('shifts', 'status');
  }
};
