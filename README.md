# Digital Signage CMS - Frontend

React-based Content Management System for managing digital signage displays, content, layouts, and schedules.

## Tech Stack

- **Framework**: React 19.2
- **Build Tool**: Create React App
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router DOM 6.30
- **HTTP Client**: Axios 1.13
- **Fonts**: Bungee (headings), Roboto (body)

## Features

- User authentication with JWT tokens
- Dashboard with statistics
- Content library with file manager
- Visual layout designer with drag-and-drop regions
- Playlist management
- Schedule management
- Display registration and monitoring
- Responsive design with Tailwind CSS

## Requirements

- Node.js 16+ 
- npm or yarn

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Endpoint**
   
   The frontend automatically detects the API URL:
   
   **Development (localhost):**
   - Automatically uses `http://localhost:8000/api`
   
   **Production:**
   - Create a `.env` file in the frontend root:
     ```bash
     REACT_APP_API_URL=https://api.yourdomain.com/api
     ```
   - Or it will auto-detect based on hostname
   
   See `.env.example` for configuration options.

3. **Start Development Server**
   ```bash
   npm start
   ```
   
   App will open at `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable components
│   └── MediaPicker.jsx  # Visual file manager modal
├── contexts/            # React contexts
│   └── AuthContext.js   # Authentication state management
├── pages/               # Page components
│   ├── Dashboard.jsx    # Main dashboard
│   ├── Login.jsx        # Login page
│   ├── Displays.jsx     # Display management
│   ├── Contents.jsx     # Content library
│   ├── Playlists.jsx    # Playlist management
│   ├── Schedules.jsx    # Schedule management
│   ├── Layouts.jsx      # Layout list
│   └── LayoutDesigner.jsx # Visual layout editor
├── services/            # API services
│   └── api.js           # Axios configuration & API methods
├── App.js               # Main app component with routing
└── index.css            # Global styles & Tailwind imports
```

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
**Note: this is a one-way operation!** Ejects from Create React App

## Features Guide

### Authentication
- Login with email/password
- Token stored in localStorage
- Auto-redirect to login on 401 errors
- User profile in sidebar

**Default Credentials:**
- Email: `admin@example.com`
- Password: `password`

### Dashboard
- Total counts for displays, content, playlists, schedules
- Quick access cards
- Recent activity overview

### Content Management
- Upload images and videos
- Automatic video thumbnail generation
- File preview with details
- Grid view with thumbnails
- Delete content

### Layout Designer
- Visual canvas showing display dimensions
- Add multiple regions to layout
- Drag regions to position
- Resize regions with handles
- Arrow key navigation (1px or 10px with Shift)
- Assign playlists or single content to regions
- Visual media picker with thumbnails
- Real-time preview of assigned media
- Properties panel with precise controls

### Playlists
- Create playlists with multiple content items
- Reorder content
- Set duration for each item
- Assign to layout regions

### Displays
- Register new displays with unique codes
- Monitor display status
- Assign layouts to displays
- View display information

### Schedules
- Create time-based schedules
- Assign playlists to time slots
- Link schedules to displays

## Styling

### Tailwind CSS
The app uses Tailwind CSS for styling. Configuration in `tailwind.config.js`:

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Bungee', 'cursive'],
        body: ['Roboto', 'sans-serif'],
      },
    },
  },
}
```

### Custom Fonts
- **Bungee**: Used for headings (h1-h6)
- **Roboto**: Used for body text

Fonts are loaded from Google Fonts in `src/index.css`

## API Integration

### Authentication Flow
1. User logs in via `/api/login`
2. Token received and stored in localStorage
3. Token automatically added to all API requests via interceptor
4. On 401 error, user redirected to login

### API Methods
Located in `src/services/api.js`:

```javascript
// Content API
contentAPI.getAll()
contentAPI.create(formData)
contentAPI.delete(id)

// Display API
displayAPI.getAll()
displayAPI.create(data)

// Layout API
layoutAPI.getAll()
layoutAPI.getOne(id)
layoutAPI.create(data)

// Region API
regionAPI.create(data)
regionAPI.update(id, data)

// Playlist API
playlistAPI.getAll()
playlistAPI.create(data)

// Schedule API
scheduleAPI.getAll()
scheduleAPI.create(data)
```

## Layout Designer

### Keyboard Shortcuts
- **Arrow Keys**: Move selected region by 1px
- **Shift + Arrow Keys**: Move selected region by 10px
- **Delete/Backspace**: Remove selected region

### Region Controls
- **Drag**: Click and drag region to move
- **Resize**: Drag corner/edge handles to resize
- **Properties**: Edit precise values in floating panel
- **Media**: Assign playlist or single content file

### Canvas
- Displays layout at 50% scale for preview
- Black background representing display screen
- Regions show assigned media thumbnails
- Selected region highlighted in blue

## Environment Variables

Create `.env` file for environment-specific configuration:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

## Building for Production

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Serve the build**
   ```bash
   npx serve -s build
   ```

3. **Deploy**
   - Upload `build/` folder to web server
   - Configure server to serve `index.html` for all routes
   - Set up HTTPS
   - Update API URL in production

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Troubleshooting

### CORS Errors
Ensure backend CORS is configured to allow frontend origin

### 401 Unauthorized
- Check if token is valid
- Verify backend is running
- Check API URL in `api.js`

### Images Not Loading
- Verify backend storage link is created
- Check file paths in API responses
- Ensure backend URL is correct

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization

- Images lazy loaded
- Code splitting with React Router
- Tailwind CSS purged in production
- Axios request/response interceptors
- React.memo for expensive components

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Proprietary
