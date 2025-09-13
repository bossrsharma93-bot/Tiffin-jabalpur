export default function Home() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Admin Dashboard (Prototype)</h1>
      <p>Use this dashboard to view orders, vendors and payouts. Connect to API at /api.</p>
      <ul>
        <li><a href="/orders">Orders</a></li>
        <li><a href="/vendors">Vendors</a></li>
      </ul>
    </div>
  )
}
