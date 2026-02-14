import { useEffect, useState } from 'react';
import { playlistAPI, contentAPI } from '../services/api';
import Swal from 'sweetalert2';

function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [contents, setContents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchPlaylists();
    fetchContents();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await playlistAPI.getAll();
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const fetchContents = async () => {
    try {
      const response = await contentAPI.getAll();
      setContents(response.data);
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlaylist) {
        await playlistAPI.update(editingPlaylist.id, formData);
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Playlist updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await playlistAPI.create(formData);
        await Swal.fire({
          icon: 'success',
          title: 'Created!',
          text: 'Playlist created successfully',
          timer: 2000,
          showConfirmButton: false
        });
      }
      setShowModal(false);
      setEditingPlaylist(null);
      setFormData({ name: '', description: '' });
      fetchPlaylists();
    } catch (error) {
      console.error('Error saving playlist:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save playlist.'
      });
    }
  };

  const handleEdit = (playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlaylist(null);
    setFormData({ name: '', description: '' });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Playlist?',
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
        await playlistAPI.delete(id);
        fetchPlaylists();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Playlist has been deleted.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting playlist:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete playlist.'
        });
      }
    }
  };

  const handleManageContent = (playlist) => {
    setSelectedPlaylist(playlist);
    setShowContentModal(true);
  };

  const handleAddContent = async (contentId) => {
    try {
      await playlistAPI.addContent(selectedPlaylist.id, contentId);
      await Swal.fire({
        icon: 'success',
        title: 'Added!',
        text: 'Content added to playlist',
        timer: 1500,
        showConfirmButton: false
      });
      fetchPlaylists();
      // Update selected playlist
      const response = await playlistAPI.getOne(selectedPlaylist.id);
      setSelectedPlaylist(response.data);
    } catch (error) {
      console.error('Error adding content:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to add content.'
      });
    }
  };

  const handleRemoveContent = async (contentId) => {
    const result = await Swal.fire({
      title: 'Remove Content?',
      text: 'Remove this content from the playlist?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await playlistAPI.removeContent(selectedPlaylist.id, contentId);
        await Swal.fire({
          icon: 'success',
          title: 'Removed!',
          text: 'Content removed from playlist',
          timer: 1500,
          showConfirmButton: false
        });
        fetchPlaylists();
        // Update selected playlist
        const response = await playlistAPI.getOne(selectedPlaylist.id);
        setSelectedPlaylist(response.data);
      } catch (error) {
        console.error('Error removing content:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to remove content.'
        });
      }
    }
  };

  const getContentIcon = (type) => {
    switch(type) {
      case 'image': 
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video': 
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default: 
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        );
    }
  };

  const availableContents = contents.filter(
    content => !selectedPlaylist?.contents?.some(pc => pc.id === content.id)
  );

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
                
                {/* Content preview */}
                {playlist.contents && playlist.contents.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-body font-semibold text-gray-600 mb-2">Content Items:</p>
                    <div className="space-y-1">
                      {playlist.contents.slice(0, 3).map((content, index) => (
                        <div key={content.id} className="text-xs font-body text-gray-700 flex items-center gap-2">
                          <span className="text-gray-400">{index + 1}.</span>
                          <span className="truncate">{content.name}</span>
                          <span className="text-gray-400">({content.duration}s)</span>
                        </div>
                      ))}
                      {playlist.contents.length > 3 && (
                        <p className="text-xs text-gray-500 italic">+{playlist.contents.length - 3} more...</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm font-body text-gray-600">
                    {playlist.contents?.length || 0} items
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleManageContent(playlist)}
                      className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-body font-semibold text-sm"
                      title="Manage content"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(playlist)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-body font-semibold text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(playlist.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-body font-semibold text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Playlist Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-2xl font-heading text-gray-900">
                {editingPlaylist ? 'Edit Playlist' : 'Create Playlist'}
              </h2>
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
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-body font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
                >
                  {editingPlaylist ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Content Modal */}
      {showContentModal && selectedPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowContentModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-2xl font-heading text-gray-900">Manage Content: {selectedPlaylist.name}</h2>
              <p className="text-sm text-gray-600 font-body mt-1">Add or remove content from this playlist</p>
            </div>
            
            <div className="grid grid-cols-2 divide-x divide-gray-200 flex-1 overflow-hidden">
              {/* Current Playlist Content */}
              <div className="p-6 overflow-y-auto">
                <h3 className="text-lg font-heading text-gray-900 mb-4">
                  Playlist Content ({selectedPlaylist.contents?.length || 0})
                </h3>
                {selectedPlaylist.contents && selectedPlaylist.contents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPlaylist.contents.map((content, index) => (
                      <div key={content.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-body font-semibold text-gray-500 w-6">{index + 1}</span>
                        <div className="text-blue-600">
                          {getContentIcon(content.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-gray-900 truncate">{content.name}</p>
                          <p className="text-xs text-gray-600 font-body">
                            {content.type} • {content.duration}s
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveContent(content.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from playlist"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-600 font-body">No content in this playlist yet</p>
                    <p className="text-sm text-gray-500 font-body mt-1">Add content from the right panel</p>
                  </div>
                )}
              </div>

              {/* Available Content */}
              <div className="p-6 overflow-y-auto bg-gray-50">
                <h3 className="text-lg font-heading text-gray-900 mb-4">
                  Available Content ({availableContents.length})
                </h3>
                {availableContents.length > 0 ? (
                  <div className="space-y-3">
                    {availableContents.map(content => (
                      <div key={content.id} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all">
                        <div className="text-gray-600">
                          {getContentIcon(content.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-gray-900 truncate">{content.name}</p>
                          <p className="text-xs text-gray-600 font-body">
                            {content.type} • {content.duration}s
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddContent(content.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Add to playlist"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 font-body">All content has been added</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowContentModal(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Playlists;
