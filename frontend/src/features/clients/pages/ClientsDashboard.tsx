const ClientsDashboard = () => {
  return (
    <div className="space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen p-4 rounded">

      {/* HEADER */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Clients Dashboard
        </h2>
        <p className="text-sm text-slate-500 dark:text-gray-300">
          Overview of clients and orders
        </p>
      </div>


      {/* CONTENT (temporary) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        Dashboard content coming soon...
      </div>

    </div>
  );
};

export default ClientsDashboard;