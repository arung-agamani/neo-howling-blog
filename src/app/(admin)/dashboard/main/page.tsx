export default function Page() {
    return (
        <>
            <h1 className="text-4xl">Hello, Awoo!</h1>
            <p className="text-xl">Last Login: {new Date().toLocaleString()}</p>
            <p className="text-xl">You have 12 posts, 11 published, 1 draft</p>

            <br />
            <h2 className="text-2xl">Analytics</h2>
            <p className="mb-8">No data</p>
            <h2 className="text-2xl">Users</h2>
            <p className="mb-8">No data</p>
            <h2 className="text-2xl">Comments</h2>
            <p className="mb-8">No data</p>
        </>
    );
}
