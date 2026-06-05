import { io } from 'socket.io-client';

async function run() {
  console.log('Testing socket connection directly to backend http://localhost:8000/chat');

  // 1. Sign in to get access token from cookie
  const res = await fetch('http://localhost:8000/api/v1/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tester2@example.com', password: '123456' }),
  });

  const body = await res.json();
  console.log('Sign-in response:', body);

  const cookies = res.headers.get('set-cookie');
  console.log('Set-Cookie headers:', cookies);

  const accessTokenMatch = cookies ? cookies.match(/access_token=([^;]+)/) : null;
  const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;
  console.log('Extracted access_token:', accessToken);

  if (!accessToken) {
    console.error('Could not extract access_token cookie!');
    return;
  }

  // 2. Connect with Cookie header
  console.log('\n--- Test 1: Connect with Cookie header ---');
  const socket1 = io('http://localhost:8000/chat', {
    transports: ['websocket'],
    extraHeaders: {
      cookie: `access_token=${accessToken}`
    }
  });

  socket1.on('connect', () => {
    console.log('Socket1 connected successfully!');
    socket1.emit('get_conversations');
  });

  socket1.on('conversations_list', (data) => {
    console.log('Socket1 conversations_list received:', data.conversations?.length, 'conversations');
    socket1.disconnect();
  });

  socket1.on('connect_error', (err) => {
    console.error('Socket1 connection error:', err.message, err.description);
    socket1.disconnect();
  });

  // 3. Connect with auth token
  console.log('\n--- Test 2: Connect with auth token ---');
  const socket2 = io('http://localhost:8000/chat', {
    transports: ['websocket'],
    auth: {
      token: accessToken
    }
  });

  socket2.on('connect', () => {
    console.log('Socket2 connected successfully!');
    socket2.emit('get_conversations');
  });

  socket2.on('conversations_list', (data) => {
    console.log('Socket2 conversations_list received:', data.conversations?.length, 'conversations');
    socket2.disconnect();
  });

  socket2.on('connect_error', (err) => {
    console.error('Socket2 connection error:', err.message, err.description);
    socket2.disconnect();
  });
}

run().catch(console.error);
