import { useEffect, useState } from 'react';
import { displayAPI } from '../services/api';

function Displays() {
  const [displays, setDisplays] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
  });

  useEffect(() => {
    fetchDisplays();
  }, []);

  const fetchDisplays = async () => {
    try {
      const response = await displayAPI.getAll();
      setDisplays(response.data);
    } catch (error) {
      console.error('Error fetching displays:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await displayAPI.create(formData);
      setShowModal(false);
      setFormData({ name: '', location: '' });
      fetchDisplays();
    } catch (error) {
      console.error('Error creating display:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this display?')) {
      try {
        await displayAPI.delete(id);
        fetchDisplays();
      } catch (error) {
        console.error('Error deleting display:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-heading text-gray-900 mb-2">Displays</h1>
          <p className="text-gray-600 font-body">Manage your digital signage displays</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-body font-semibold"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png" alt="Add" className="w-5 h-5 brightness-0 invert" />
          Add Display
        </button>
      </div>

      {displays.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <img src="https://cdn-icons-png.flaticon.com/512/2956/2956769.png" alt="Empty" className="w-24 h-24 mx-auto mb-6 opacity-30" />
          <h3 className="text-2xl font-heading text-gray-900 mb-2">No displays registered</h3>
          <p className="text-gray-600 font-body mb-6">Add your first display to start showing content</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
          >
            Add Display
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Last Seen</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displays.map(display => (
                <tr key={display.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-body font-semibold text-gray-900">{display.name}</td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600 bg-gray-50 rounded">{display.code}</td>
                  <td className="px-6 py-4 font-body text-gray-600">{display.location || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-semibold ${
                      display.status === 'online' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        display.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      {display.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body text-sm text-gray-600">
                    {display.last_seen ? new Date(display.last_seen).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(display.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-body font-semibold text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-2xl font-heading text-gray-900">Add New Display</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Lobby Display"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Main Entrance"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-body font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
                >
                  Add Display
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Displays;
