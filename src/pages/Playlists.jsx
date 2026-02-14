import { useEffect, useState } from 'react';
import { playlistAPI } from '../services/api';

function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await playlistAPI.getAll();
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await playlistAPI.create(formData);
      setShowModal(false);
      setFormData({ name: '', description: '' });
      fetchPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      try {
        await playlistAPI.delete(id);
        fetchPlaylists();
      } catch (error) {
        console.error('Error deleting playlist:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-heading text-gray-900 mb-2">Playlists</h1>
          <p className="text-gray-600 font-body">Create and manage content playlists</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-body font-semibold"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png" alt="Add" className="w-5 h-5 brightness-0 invert" />
          Create Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <img src="https://cdn-icons-png.flaticon.com/512/2956/2956806.png" alt="Empty" className="w-24 h-24 mx-auto mb-6 opacity-30" />
          <h3 className="text-2xl font-heading text-gray-900 mb-2">No playlists yet</h3>
          <p className="text-gray-600 font-body mb-6">Create your first playlist to organize content</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
          >
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map(playlist => (
            <div key={playlist.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-heading text-gray-900 mb-2">{playlist.name}</h3>
                    <p className="text-gray-600 font-body text-sm line-clamp-2">
                      {playlist.description || 'No description'}
                    </p>
                  </div>
                  <img src="https://cdn-icons-png.flaticon.com/512/2956/2956806.png" alt="Playlist" className="w-10 h-10 opacity-50" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm font-body text-gray-600">
                    {playlist.contents?.length || 0} items
                  </span>
                  <button
                    onClick={() => handleDelete(playlist.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-body font-semibold text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-2xl font-heading text-gray-900">Create Playlist</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Playlist Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Morning Announcements"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe this playlist..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body min-h-[100px]"
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Playlists;
