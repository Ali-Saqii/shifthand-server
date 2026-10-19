const AppError = require('../../lib/AppError');

function models() {
  return require('../../db/models');
}

async function findShift(shiftId) {
  const { Shift } = models();
  const shift = await Shift.findByPk(shiftId);
  if (!shift) {
    throw new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND');
  }
  return shift;
}

async function list(shiftId) {
  await findShift(shiftId);
  const { Signup, User } = models();
  const signups = await Signup.findAll({
    where: { shiftId },
    attributes: ['id', 'createdAt'],
    include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'ASC']]
  });
  return signups.map((signup) => ({
    id: signup.id,
    user: signup.User,
    createdAt: signup.createdAt
  }));
}

async function create(shiftId, userId) {
  const { sequelize, Shift, Signup } = models();
  return sequelize.transaction(async (transaction) => {
    const shift = await Shift.findByPk(shiftId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!shift) {
      throw new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND');
    }

    const existing = await Signup.findOne({ where: { shiftId, userId }, transaction });
    if (existing) {
      throw new AppError('You are already signed up for this shift', 409, 'SIGNUP_ALREADY_EXISTS');
    }

    const count = await Signup.count({ where: { shiftId }, transaction });
    if (count >= shift.capacity) {
      throw new AppError('This shift is full', 409, 'SHIFT_CAPACITY_REACHED');
    }

    try {
      return await Signup.create({ shiftId, userId }, { transaction });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('You are already signed up for this shift', 409, 'SIGNUP_ALREADY_EXISTS');
      }
      throw error;
    }
  });
}

async function remove(shiftId, userId) {
  const { Signup } = models();
  const signup = await Signup.findOne({ where: { shiftId, userId } });
  if (!signup) {
    throw new AppError('Signup not found', 404, 'SIGNUP_NOT_FOUND');
  }
  await signup.destroy();
}

module.exports = { list, create, remove };