import { useEffect, useState } from 'react';
import { displayAPI, layoutAPI } from '../services/api';
import Swal from 'sweetalert2';

function Displays() {
  const [displays, setDisplays] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [newDisplayCode, setNewDisplayCode] = useState(null);
  const [editingDisplay, setEditingDisplay] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
  });

  useEffect(() => {
    fetchDisplays();
    fetchLayouts();
  }, []);

  const fetchDisplays = async () => {
    try {
      const response = await displayAPI.getAll();
      setDisplays(response.data);
    } catch (error) {
      console.error('Error fetching displays:', error);
    }
  };

  const fetchLayouts = async () => {
    try {
      const response = await layoutAPI.getAll();
      setLayouts(response.data);
    } catch (error) {
      console.error('Error fetching layouts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDisplay) {
        // Update existing display
        await displayAPI.update(editingDisplay.id, formData);
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Display updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
        setShowModal(false);
        setEditingDisplay(null);
      } else {
        // Create new display
        const response = await displayAPI.create(formData);
        setNewDisplayCode(response.data.code);
        setShowCodeModal(true);
        setShowModal(false);
      }
      setFormData({ name: '', location: '' });
      fetchDisplays();
    } catch (error) {
      console.error('Error saving display:', error);
      const errorMessage = error.response?.data?.message || 'Error saving display. Please try again.';
      Swal.fire({
        icon: 'error',
        title: editingDisplay ? 'Error Updating Display' : 'Error Creating Display',
        text: errorMessage
      });
    }
  };

  const handleEdit = (display) => {
    setEditingDisplay(display);
    setFormData({
      name: display.name,
      location: display.location || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDisplay(null);
    setFormData({ name: '', location: '' });
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(newDisplayCode);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Display code copied to clipboard',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Display?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await displayAPI.delete(id);
        fetchDisplays();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Display has been deleted.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting display:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete display.'
        });
      }
    }
  };

  const handleLayoutChange = async (displayId, layoutId) => {
    try {
      await displayAPI.update(displayId, { layout_id: layoutId || null });
      fetchDisplays();
    } catch (error) {
      console.error('Error updating display layout:', error);
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
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Layout</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Last Seen</th>
                <th className="px-6 py-4 text-left text-xs font-body font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displays.map(display => (
                <tr key={display.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-body font-semibold text-gray-900">{display.name}</td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">
                    <span className="bg-gray-50 px-2 py-1 rounded">{display.code}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{display.ip_address || '-'}</td>
                  <td className="px-6 py-4 font-body text-gray-600">{display.location || '-'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={display.layout_id || ''}
                      onChange={(e) => handleLayoutChange(display.id, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm"
                    >
                      <option value="">No Layout</option>
                      {layouts.map(layout => (
                        <option key={layout.id} value={layout.id}>
                          {layout.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-semibold ${
                      display.status === 'online' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        display.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                      }`}></span>
                      {display.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body text-sm text-gray-600">
                    {display.last_seen ? new Date(display.last_seen).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(display)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-body font-semibold text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(display.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-body font-semibold text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-2xl font-heading text-gray-900">
                {editingDisplay ? 'Edit Display' : 'Add New Display'}
              </h2>
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

                {!editingDisplay && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-body font-semibold text-blue-900 mb-2">How It Works</h3>
                    <ol className="font-body text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Create the display and get a unique code</li>
                      <li>Open the player on your device</li>
                      <li>Enter the display code and global token</li>
                      <li>Assign a layout to start displaying content</li>
                    </ol>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-body font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
                >
                  {editingDisplay ? 'Update Display' : 'Add Display'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCodeModal && newDisplayCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCodeModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-2xl font-heading text-gray-900">Display Created!</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-body font-semibold text-green-900 mb-1">Display Code Generated</h3>
                    <p className="font-body text-sm text-green-800">
                      Use this code to connect your player device
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Display Code</label>
                <div className="relative">
                  <div className="px-4 py-4 bg-gray-50 rounded-xl font-mono text-3xl font-bold text-center text-gray-900 letter-spacing-wide">
                    {newDisplayCode}
                  </div>
                  <button
                    onClick={copyCode}
                    className="absolute top-2 right-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-body font-semibold text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-body font-semibold text-blue-900 mb-2">Next Steps</h3>
                <ol className="font-body text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Open the player on your device</li>
                  <li>Enter this display code: <strong>{newDisplayCode}</strong></li>
                  <li>Enter the global player token</li>
                  <li>Assign a layout to start displaying content</li>
                </ol>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end rounded-b-2xl">
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Displays;
