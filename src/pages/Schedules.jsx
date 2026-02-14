import { useEffect, useState } from 'react';
import { scheduleAPI, displayAPI, playlistAPI } from '../services/api';

function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [displays, setDisplays] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    display_id: '',
    playlist_id: '',
    start_time: '',
    end_time: '',
    is_active: true,
  });

  useEffect(() => {
    fetchSchedules();
    fetchDisplays();
    fetchPlaylists();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await scheduleAPI.getAll();
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchDisplays = async () => {
    try {
      const response = await displayAPI.getAll();
      setDisplays(response.data);
    } catch (error) {
      console.error('Error fetching displays:', error);
    }
  };

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
      await scheduleAPI.create(formData);
      setShowModal(false);
      setFormData({
        display_id: '',
        playlist_id: '',
        start_time: '',
        end_time: '',
        is_active: true,
      });
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Error creating schedule. Make sure all fields are filled correctly.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await scheduleAPI.delete(id);
        fetchSchedules();
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const getDisplayName = (id) => {
    const display = displays.find(d => d.id === id);
    return display ? display.name : `Display #${id}`;
  };

  const getPlaylistName = (id) => {
    const playlist = playlists.find(p => p.id === id);
    return playlist ? playlist.name : `Playlist #${id}`;
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-heading text-gray-900 mb-2">Schedules</h1>
          <p className="text-gray-600 font-body">Schedule content to displays</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-body font-semibold"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png" alt="Add" className="w-5 h-5 brightness-0 invert" />
          Create Schedule
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <img src="https://cdn-icons-png.flaticon.com/512/747/747310.png" alt="Empty" className="w-24 h-24 mx-auto mb-6 opacity-30" />
          <h3 className="text-2xl font-heading text-gray-900 mb-2">No schedules yet</h3>
          <p className="text-gray-600 font-body mb-6">Create a schedule to show playlists on displays</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
          >
            Create Schedule
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Display</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Playlist</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Start Time</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">End Time</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map(schedule => (
                <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-body font-semibold text-gray-900">{getDisplayName(schedule.display_id)}</td>
                  <td className="px-6 py-4 font-body text-gray-600">{getPlaylistName(schedule.playlist_id)}</td>
                  <td className="px-6 py-4 font-body text-sm text-gray-600">{new Date(schedule.start_time).toLocaleString()}</td>
                  <td className="px-6 py-4 font-body text-sm text-gray-600">{new Date(schedule.end_time).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-semibold ${
                      schedule.is_active 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(schedule.id)}
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
              <h2 className="text-2xl font-heading text-gray-900">Create Schedule</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Display</label>
                  <select
                    value={formData.display_id}
                    onChange={(e) => setFormData({...formData, display_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
                  >
                    <option value="">Select a display</option>
                    {displays.map(display => (
                      <option key={display.id} value={display.id}>
                        {display.name} - {display.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Playlist</label>
                  <select
                    value={formData.playlist_id}
                    onChange={(e) => setFormData({...formData, playlist_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
                  >
                    <option value="">Select a playlist</option>
                    {playlists.map(playlist => (
                      <option key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-body font-semibold text-gray-700">
                    Active
                  </label>
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
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedules;
