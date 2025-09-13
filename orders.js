import useSWR from 'swr';
const fetcher = (url) => fetch(url).then(r=>r.json());
export default function Orders() {
  const { data, error } = useSWR('/api/admin/orders', fetcher);
  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div style={{ padding: 24 }}>
      <h2>Recent Orders</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
