import { useEffect, useState } from 'react';
import { contentAPI } from '../services/api';

function Contents() {
  const [contents, setContents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'image',
    duration: 10,
    content: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    fetchContents();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith('video/')) {
        const url = URL.createObjectURL(selectedFile);
        setFilePreview(url);
      }
    } else {
      setFilePreview(null);
    }
  }, [selectedFile]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('type', formData.type);
    data.append('duration', formData.duration);
    
    if (selectedFile) {
      data.append('file', selectedFile);
    }
    
    if (formData.content) {
      data.append('content', formData.content);
    }

    try {
      const response = await contentAPI.create(data);
      console.log('Upload success:', response);
      setShowModal(false);
      setFormData({ name: '', type: 'image', duration: 10, content: '' });
      setSelectedFile(null);
      setFilePreview(null);
      fetchContents();
    } catch (error) {
      console.error('Error creating content:', error);
      console.error('Error response:', error.response);
      alert(`Error uploading content: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await contentAPI.delete(id);
        fetchContents();
      } catch (error) {
        console.error('Error deleting content:', error);
      }
    }
  };

  const getContentIcon = (type) => {
    switch(type) {
      case 'image': 
        return (
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video': 
        return (
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'webpage': 
        return (
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
      case 'html': 
        return (
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      default: 
        return (
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-heading text-gray-900 mb-2">Content Library</h1>
          <p className="text-gray-600 font-body">Manage your media files and content</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-body font-semibold"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/3097/3097412.png" alt="Upload" className="w-5 h-5 brightness-0 invert" />
          Upload Content
        </button>
      </div>

      {contents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <img src="https://cdn-icons-png.flaticon.com/512/2344/2344895.png" alt="Empty" className="w-24 h-24 mx-auto mb-6 opacity-30" />
          <h3 className="text-2xl font-heading text-gray-900 mb-2">No content yet</h3>
          <p className="text-gray-600 font-body mb-6">Upload your first image, video, or webpage to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
          >
            Upload Content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contents.map(content => (
            <div key={content.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                {content.thumbnail_path ? (
                  <img 
                    src={`http://localhost:8000/storage/${content.thumbnail_path}`} 
                    alt={content.name}
                    className="w-full h-full object-cover"
                  />
                ) : content.file_path && content.type === 'image' ? (
                  <img 
                    src={`http://localhost:8000/storage/${content.file_path}`} 
                    alt={content.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getContentIcon(content.type)
                )}
              </div>
              <div className="p-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-body font-semibold rounded-full mb-2 uppercase">
                  {content.type}
                </span>
                <h3 className="text-lg font-heading text-gray-900 mb-2 truncate">{content.name}</h3>
                <p className="text-sm text-gray-600 font-body mb-4">Duration: {content.duration}s</p>
                <button
                  onClick={() => handleDelete(content.id)}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-body font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-2xl font-heading text-gray-900">Upload Content</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Content Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Content Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="webpage">Webpage</option>
                    <option value="html">HTML</option>
                  </select>
                </div>

                {(formData.type === 'image' || formData.type === 'video') && (
                  <div>
                    <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Upload File</label>
                    <div
                      onClick={() => document.getElementById('file-input').click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <input
                        id="file-input"
                        type="file"
                        accept={formData.type === 'image' ? 'image/*' : 'video/*'}
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="hidden"
                      />
                      {!selectedFile ? (
                        <>
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-gray-600 font-body">Click to upload file</p>
                        </>
                      ) : (
                        <div className="space-y-4">
                          {filePreview && formData.type === 'image' && (
                            <img src={filePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                          )}
                          {filePreview && formData.type === 'video' && (
                            <video src={filePreview} className="max-h-48 mx-auto rounded-lg" controls />
                          )}
                          <div className="bg-gray-50 rounded-lg p-4 text-left">
                            <p className="font-body font-semibold text-gray-900 mb-2">{selectedFile.name}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 font-body">
                              <div>
                                <span className="font-semibold">Size:</span> {formatFileSize(selectedFile.size)}
                              </div>
                              <div>
                                <span className="font-semibold">Type:</span> {selectedFile.type}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              setFilePreview(null);
                            }}
                            className="text-sm text-red-600 hover:text-red-700 font-body font-semibold"
                          >
                            Remove file
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(formData.type === 'webpage' || formData.type === 'html') && (
                  <div>
                    <label className="block text-sm font-body font-semibold text-gray-700 mb-2">
                      {formData.type === 'webpage' ? 'URL' : 'HTML Content'}
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder={formData.type === 'webpage' ? 'https://example.com' : '<h1>Your HTML here</h1>'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body min-h-[120px]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Duration (seconds)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
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
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contents;
