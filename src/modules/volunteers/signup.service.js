const crypto = require('crypto');
const { Op } = require('sequelize');
const AppError = require('../../lib/AppError');

const ACTIVE_STATUSES = ['unverified', 'pending', 'confirmed', 'offered'];
const HOLD_MINUTES = 120;
const IDEMPOTENCY_HOURS = 24;
const DEADLOCK_MAX_ATTEMPTS = 3;
const DEADLOCK_RETRY_DELAY_MS = 50;

function models() {
  return require('../../db/models');
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function requestHash(shiftId, accessToken) {
  return hash(JSON.stringify({ shiftId, accessToken }));
}

function shiftsOverlap(first, second) {
  const firstStart = new Date(first.startsAt).getTime();
  const firstEnd = new Date(first.endsAt).getTime();
  const secondStart = new Date(second.startsAt).getTime();
  const secondEnd = new Date(second.endsAt).getTime();
  return firstStart < secondEnd && secondStart < firstEnd;
}

function isMySqlDeadlock(error) {
  return error?.original?.errno === 1213 ||
    error?.errno === 1213 ||
    error?.original?.code === 'ER_LOCK_DEADLOCK' ||
    error?.code === 'ER_LOCK_DEADLOCK';
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function validateIdempotency(existing, currentHash) {
  if (!existing) return;
  if (existing.requestHash !== currentHash) {
    throw new AppError(
      'Idempotency-Key was already used with a different request',
      409,
      'IDEMPOTENCY_KEY_REUSED'
    );
  }
}

async function findVolunteerForToken(Volunteer, VolunteerAccessToken, accessToken, transaction) {
  const token = await VolunteerAccessToken.findOne({
    where: {
      tokenHash: hash(accessToken),
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date() }
    },
    transaction,
    lock: transaction.LOCK.UPDATE
  });
  if (!token) {
    throw new AppError('Invalid or expired volunteer access token', 401, 'INVALID_VOLUNTEER_TOKEN');
  }
  const volunteer = await Volunteer.findByPk(token.volunteerId, {
    transaction,
    lock: transaction.LOCK.UPDATE
  });
  if (!volunteer || volunteer.blocked) {
    throw new AppError('Volunteer access is unavailable', 403, 'VOLUNTEER_BLOCKED');
  }
  return volunteer;
}

async function create(shiftId, accessToken, idempotencyKey) {
  const {
    sequelize, Volunteer, VolunteerAccessToken, Shift, Event, Signup,
    MessageDelivery, IdempotencyKey
  } = models();
  const currentHash = requestHash(shiftId, accessToken);
  const scopedKey = `volunteer:${hash(accessToken)}:${idempotencyKey}`;

  return createWithRetry(
    sequelize,
    async (transaction) => createInTransaction({
      sequelize,
      Volunteer,
      VolunteerAccessToken,
      Shift,
      Event,
      Signup,
      MessageDelivery,
      IdempotencyKey,
      shiftId,
      accessToken,
      idempotencyKey,
      currentHash,
      scopedKey,
      transaction
    })
  );
}

async function createWithRetry(sequelize, operation) {
  for (let attempt = 1; attempt <= DEADLOCK_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await sequelize.transaction(operation);
    } catch (error) {
      if (!isMySqlDeadlock(error) || attempt === DEADLOCK_MAX_ATTEMPTS) throw error;
      await sleep(DEADLOCK_RETRY_DELAY_MS * (2 ** (attempt - 1)));
    }
  }
}

async function createInTransaction({
  Volunteer,
  VolunteerAccessToken,
  Shift,
  Event,
  Signup,
  MessageDelivery,
  IdempotencyKey,
  shiftId,
  accessToken,
  idempotencyKey,
  currentHash,
  scopedKey,
  transaction
}) {
    const existingIdempotency = await IdempotencyKey.findOne({
      where: {
        key: scopedKey,
        expiresAt: { [Op.gt]: new Date() }
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    validateIdempotency(existingIdempotency, currentHash);
    if (existingIdempotency) {
      return existingIdempotency.responseBody;
    }

    const volunteer = await findVolunteerForToken(
      Volunteer,
      VolunteerAccessToken,
      accessToken,
      transaction
    );
    const shift = await Shift.findByPk(shiftId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!shift) {
      throw new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND');
    }
    const event = await Event.findByPk(shift.eventId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }
    if (event.status !== 'published') {
      throw new AppError('Event is not available for signup', 409, 'EVENT_NOT_OPEN');
    }
    if (new Date(event.startsAt) <= new Date() || new Date(shift.startsAt) <= new Date()) {
      throw new AppError('This shift has already started', 409, 'SHIFT_ALREADY_STARTED');
    }
    if (shift.status !== 'active') {
      throw new AppError('This shift is not available', 409, 'SHIFT_NOT_AVAILABLE');
    }

    const overlappingSignups = await Signup.findAll({
      where: {
        volunteerId: volunteer.id,
        status: { [Op.in]: ACTIVE_STATUSES },
        shiftId: { [Op.ne]: shift.id }
      },
      include: [{ model: Shift }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    const overlappingShift = overlappingSignups
      .map((signup) => signup.Shift)
      .find((otherShift) => otherShift && shiftsOverlap(shift, otherShift));
    if (overlappingShift) {
      throw new AppError(
        'You are already signed up for an overlapping shift',
        409,
        'SHIFT_OVERLAP',
        { overlappingShiftId: overlappingShift.id }
      );
    }

    const existingSignup = await Signup.findOne({
      where: { shiftId, volunteerId: volunteer.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (existingSignup && ACTIVE_STATUSES.includes(existingSignup.status)) {
      const response = {
        signup: existingSignup,
        reused: true
      };
      await IdempotencyKey.create({
        key: scopedKey,
        requestHash: currentHash,
        organizationId: event.organizationId,
        responseStatus: 200,
        responseBody: response,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_HOURS * 60 * 60 * 1000)
      }, { transaction });
      return response;
    }

    const activeCount = await Signup.count({
      where: { shiftId, status: { [Op.in]: ACTIVE_STATUSES } },
      transaction
    });
    if (activeCount >= shift.capacity) {
      throw new AppError('This shift is full', 409, 'SHIFT_FULL');
    }

    const signup = existingSignup
      ? await existingSignup.update({
        status: 'unverified',
        holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
        cancelledBy: null,
        lateCancel: false
      }, { transaction })
      : await Signup.create({
        shiftId,
        volunteerId: volunteer.id,
        status: 'unverified',
        holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000)
      }, { transaction });

    const response = {
      signup: {
        id: signup.id,
        shiftId: signup.shiftId,
        status: signup.status,
        holdExpiresAt: signup.holdExpiresAt
      },
      reused: false
    };
    await MessageDelivery.create({
      organizationId: event.organizationId,
      recipient: volunteer.email,
      channel: 'email',
      template: 'signup-confirmation',
      payload: {
        name: volunteer.name,
        shiftTitle: shift.title,
        holdExpiresAt: signup.holdExpiresAt
      },
      availableAt: new Date(),
      idempotencyKey: `signup-confirmation:${signup.id}`
    }, { transaction });
    await IdempotencyKey.create({
      key: scopedKey,
      requestHash: currentHash,
      organizationId: event.organizationId,
      responseStatus: 201,
      responseBody: response,
      expiresAt: new Date(Date.now() + IDEMPOTENCY_HOURS * 60 * 60 * 1000)
    }, { transaction });
    return response;
}

module.exports = { create, createWithRetry, shiftsOverlap, isMySqlDeadlock };
