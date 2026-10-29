'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = Sequelize.fn('NOW');

    await queryInterface.addColumn('organizations', 'timezone', {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'UTC'
    });
    await queryInterface.addColumn('organizations', 'settings', {
      type: Sequelize.JSON,
      allowNull: true
    });

    await queryInterface.sequelize.query(
      "UPDATE memberships SET role = 'coordinator' WHERE role = 'admin'"
    );
    await queryInterface.sequelize.query(
      "UPDATE memberships SET role = 'shift_lead' WHERE role = 'member'"
    );
    await queryInterface.changeColumn('memberships', 'role', {
      type: Sequelize.ENUM('owner', 'coordinator', 'shift_lead'),
      allowNull: false,
      defaultValue: 'shift_lead'
    });

    await queryInterface.createTable('staff_invites', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      organization_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      email: { type: Sequelize.STRING(255), allowNull: false },
      role: {
        type: Sequelize.ENUM('coordinator', 'shift_lead'),
        allowNull: false
      },
      code_hash: { type: Sequelize.STRING(255), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now }
    });
    await queryInterface.addIndex('staff_invites', ['organization_id']);
    await queryInterface.addIndex('staff_invites', ['code_hash'], {
      unique: true,
      name: 'staff_invites_code_hash_unique'
    });

    await queryInterface.createTable('volunteers', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      organization_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(32), allowNull: true },
      contact_verified_at: { type: Sequelize.DATE, allowNull: true },
      consent_at: { type: Sequelize.DATE, allowNull: true },
      blocked: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now }
    });
    await queryInterface.addConstraint('volunteers', {
      fields: ['organization_id', 'email'],
      type: 'unique',
      name: 'volunteers_organization_email_unique'
    });

    await queryInterface.createTable('volunteer_access_tokens', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      volunteer_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'volunteers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      token_hash: { type: Sequelize.STRING(255), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      revoked_at: { type: Sequelize.DATE, allowNull: true },
      last_used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now }
    });
    await queryInterface.addIndex('volunteer_access_tokens', ['token_hash'], {
      unique: true,
      name: 'volunteer_access_tokens_token_hash_unique'
    });
    await queryInterface.addIndex('volunteer_access_tokens', ['volunteer_id']);

    await queryInterface.addColumn('events', 'venue', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('events', 'status', {
      type: Sequelize.ENUM('draft', 'published', 'cancelled', 'completed'),
      allowNull: false,
      defaultValue: 'draft'
    });
    await queryInterface.addColumn('events', 'public_slug', {
      type: Sequelize.STRING(180),
      allowNull: true
    });
    await queryInterface.addIndex('events', ['public_slug'], {
      unique: true,
      name: 'events_public_slug_unique'
    });
    await queryInterface.addIndex('events', ['organization_id', 'status']);

    await queryInterface.addColumn('shifts', 'role_label', {
      type: Sequelize.STRING(120),
      allowNull: true
    });
    await queryInterface.addColumn('shifts', 'starts_at_utc', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('shifts', 'ends_at_utc', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('shifts', 'cancel_cutoff_hours', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('shifts', 'lead_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('shifts', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('signups', 'volunteer_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'volunteers', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE'
    });
    await queryInterface.changeColumn('signups', 'user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE'
    });
    await queryInterface.addColumn('signups', 'status', {
      type: Sequelize.ENUM(
        'unverified', 'pending', 'confirmed', 'waitlisted', 'offered',
        'cancelled', 'declined', 'expired', 'completed', 'no_show'
      ),
      allowNull: false,
      defaultValue: 'confirmed'
    });
    await queryInterface.addColumn('signups', 'hold_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('signups', 'queue_position', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });
    await queryInterface.addColumn('signups', 'offer_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('signups', 'cancelled_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('signups', 'late_cancel', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addIndex('signups', ['shift_id', 'status']);
    await queryInterface.addIndex('signups', ['volunteer_id', 'status']);
    await queryInterface.addIndex('signups', ['shift_id', 'volunteer_id'], {
      unique: true,
      name: 'signups_shift_volunteer_unique'
    });

    await queryInterface.createTable('attendance', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      signup_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'signups', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      checked_in_at: { type: Sequelize.DATE, allowNull: true },
      checked_out_at: { type: Sequelize.DATE, allowNull: true },
      method: { type: Sequelize.STRING(32), allowNull: true },
      actor_user_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      minutes: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      status: { type: Sequelize.STRING(32), allowNull: true },
      review_notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now }
    });
    await queryInterface.addConstraint('attendance', {
      fields: ['signup_id'],
      type: 'unique',
      name: 'attendance_signup_unique'
    });

    await queryInterface.createTable('attendance_adjustments', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      attendance_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'attendance', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      previous_values: { type: Sequelize.JSON, allowNull: false },
      new_values: { type: Sequelize.JSON, allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: false },
      actor_user_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now }
    });

    await queryInterface.createTable('message_deliveries', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      organization_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      recipient: { type: Sequelize.STRING(255), allowNull: false },
      channel: { type: Sequelize.STRING(32), allowNull: false },
      template: { type: Sequelize.STRING(120), allowNull: false },
      payload: { type: Sequelize.JSON, allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending' },
      attempts: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      available_at: { type: Sequelize.DATE, allowNull: false },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      last_error: { type: Sequelize.TEXT, allowNull: true },
      idempotency_key: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now }
    });
    await queryInterface.addIndex('message_deliveries', ['status', 'available_at']);
    await queryInterface.addIndex('message_deliveries', ['idempotency_key'], {
      unique: true,
      name: 'message_deliveries_idempotency_unique'
    });

    await queryInterface.createTable('reminder_jobs', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      signup_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'signups', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      reminder_type: { type: Sequelize.STRING(32), allowNull: false },
      due_at: { type: Sequelize.DATE, allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending' },
      claimed_at: { type: Sequelize.DATE, allowNull: true },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now }
    });
    await queryInterface.addConstraint('reminder_jobs', {
      fields: ['signup_id', 'reminder_type'],
      type: 'unique',
      name: 'reminder_jobs_signup_type_unique'
    });
    await queryInterface.addIndex('reminder_jobs', ['status', 'due_at']);

    await queryInterface.createTable('idempotency_keys', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      user_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      organization_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      key: { type: Sequelize.STRING(255), allowNull: false },
      request_hash: { type: Sequelize.STRING(128), allowNull: false },
      response_status: { type: Sequelize.INTEGER, allowNull: true },
      response_body: { type: Sequelize.JSON, allowNull: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now }
    });
    await queryInterface.addConstraint('idempotency_keys', {
      fields: ['user_id', 'key'],
      type: 'unique',
      name: 'idempotency_keys_user_key_unique'
    });

    await queryInterface.createTable('audit_log', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      organization_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      actor_user_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      action: { type: Sequelize.STRING(120), allowNull: false },
      entity_type: { type: Sequelize.STRING(80), allowNull: false },
      entity_id: { type: Sequelize.UUID, allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now }
    });
    await queryInterface.addIndex('audit_log', ['organization_id', 'created_at']);
    await queryInterface.addIndex('audit_log', ['entity_type', 'entity_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('signups', 'signups_volunteer_id_foreign_idx');
    await queryInterface.removeConstraint('signups', 'signups_cancelled_by_foreign_idx');
    await queryInterface.removeIndex('events', 'events_public_slug_unique');
    await queryInterface.removeIndex('events', 'events_organization_id_status');
    await queryInterface.removeIndex('signups', 'signups_shift_volunteer_unique');
    await queryInterface.removeIndex('signups', 'signups_shift_id_status');
    await queryInterface.removeIndex('signups', 'signups_volunteer_id_status');
    await queryInterface.removeColumn('signups', 'volunteer_id');
    for (const table of [
      'audit_log', 'idempotency_keys', 'reminder_jobs', 'message_deliveries',
      'attendance_adjustments', 'attendance', 'volunteer_access_tokens',
      'volunteers', 'staff_invites'
    ]) {
      await queryInterface.dropTable(table);
    }

    for (const [table, column] of [
      ['signups', 'late_cancel'], ['signups', 'cancelled_by'], ['signups', 'offer_expires_at'],
      ['signups', 'queue_position'], ['signups', 'hold_expires_at'], ['signups', 'status'],
      ['shifts', 'notes'], ['shifts', 'lead_user_id'],
      ['shifts', 'cancel_cutoff_hours'], ['shifts', 'ends_at_utc'], ['shifts', 'starts_at_utc'],
      ['shifts', 'role_label'], ['events', 'public_slug'], ['events', 'status'], ['events', 'venue'],
      ['organizations', 'settings'], ['organizations', 'timezone']
    ]) {
      await queryInterface.removeColumn(table, column);
    }

    await queryInterface.changeColumn('memberships', 'role', {
      type: Sequelize.ENUM('owner', 'admin', 'member'),
      allowNull: false,
      defaultValue: 'member'
    });
    await queryInterface.changeColumn('signups', 'user_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE'
    });
    await queryInterface.sequelize.query(
      "UPDATE memberships SET role = 'admin' WHERE role = 'coordinator'"
    );
    await queryInterface.sequelize.query(
      "UPDATE memberships SET role = 'member' WHERE role = 'shift_lead'"
    );
  }
};
