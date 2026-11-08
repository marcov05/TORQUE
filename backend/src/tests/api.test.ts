import test from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

process.env.NODE_ENV ??= 'test';
process.env.MYSQL_DATABASE ??= 'torque_test';
process.env.MYSQL_USER ??= 'torque_test';
process.env.MYSQL_PASSWORD ??= 'torque_test';
process.env.JWT_SECRET ??= 'test-only-secret-that-is-longer-than-thirty-two-characters';

test('API responde saúde e exige JWT em endpoints administrativos', async () => {
  const imported = await import('../app.js');
  const app = imported.default as unknown as import('express').Express;
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  try {
    const health = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    assert.equal(health.status, 200);
    const protectedResponse = await fetch(`http://127.0.0.1:${address.port}/api/clientes`);
    assert.equal(protectedResponse.status, 401);
    const protectedDashboard = await fetch(`http://127.0.0.1:${address.port}/api/dashboard`);
    assert.equal(protectedDashboard.status, 401);
    const protectedDecision = await fetch(`http://127.0.0.1:${address.port}/api/ordens-servico/1/aprovacao`, { method: 'PATCH' });
    assert.equal(protectedDecision.status, 401);
    const invalidRegister = await fetch(`http://127.0.0.1:${address.port}/api/auth/register`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}),
    });
    assert.equal(invalidRegister.status, 400);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
