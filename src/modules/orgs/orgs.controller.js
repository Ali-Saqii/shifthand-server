const orgService = require('./orgs.service');
const { sendData } = require('../../lib/respond');

async function create(req, res, next) {
  try {
    sendData(res, await orgService.createWithDetails(req.user.id, req.body), 201);
  } catch (error) {
    console.error(`Error creating organization: ${error.message}`);
    next(error);
  }
}

async function list(req, res, next) {
  try {
    sendData(res, await orgService.list(req.user.id));
  } catch (error) {
    next(error);
  }
}

async function listMembers(req, res, next) {
  try {
    sendData(res, await orgService.listMembers(req.params.organizationId));
  } catch (error) {
    next(error);
  }
}

async function addMember(req, res, next) {
  try {
    sendData(res, await orgService.addMember(
      req.params.organizationId,
      req.body.email,
      req.body.role
    ), 201);
  } catch (error) {
    next(error);
  }
}

async function createInvite(req, res, next) {
  try {
    sendData(res, await orgService.createInvite(
      req.params.organizationId,
      req.body.email,
      req.body.role
    ), 201);
  } catch (error) {
    next(error);
  }
}

async function acceptInvite(req, res, next) {
  try {
    sendData(res, await orgService.acceptInvite(
      req.user.id,
      req.params.organizationId,
      req.body.code
    ), 201);
  } catch (error) {
    next(error);
  }
}

async function removeMember(req, res, next) {
  try {
    await orgService.removeMember(req.params.organizationId, req.params.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function updateMember(req, res, next) {
  try {
    sendData(res, await orgService.updateMember(
      req.params.organizationId,
      req.params.userId,
      req.body.role
    ));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create, list, listMembers, addMember, createInvite, acceptInvite, removeMember, updateMember
};