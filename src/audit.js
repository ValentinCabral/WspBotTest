function logAudit(db, { companyId, userId, action, entity, entityId, payload }) {
  db.audit_logs.push({
    id: db.nextId('audit_logs'),
    company_id: companyId,
    user_id: userId || null,
    action,
    entity,
    entity_id: entityId ? String(entityId) : null,
    payload: payload || null,
    created_at: new Date().toISOString()
  });
}

module.exports = { logAudit };
