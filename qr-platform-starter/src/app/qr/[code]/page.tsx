import Client from './Client';

export default function Page({ params }: { params: { code: string } }) {
  return <Client code={params.code} />;
}
