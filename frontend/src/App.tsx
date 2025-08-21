import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './contexts/ToastContext'
import DashboardHome from './components/DashboardHome'
import FeatureRequest from './components/FeatureRequest'
import WorkflowBuilder from './components/WorkflowBuilder'

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/features', label: 'Feature Requests', icon: '💡' },
    { path: '/workflows', label: 'Workflow Builder', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`inline-flex items-center px-1 pt-1 pb-4 border-b-2 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Self-Evolving Workflow Automator
                </h1>
              </div>
            </header>
            <Navigation />
            <main>
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={
                      <div className="px-4 py-6 sm:px-0">
                        <DashboardHome />
                      </div>
                    } />
                    <Route path="/features" element={
                      <div className="px-4 py-6 sm:px-0">
                        <FeatureRequest />
                      </div>
                    } />
                    <Route path="/workflows" element={
                      <div className="px-4 py-6 sm:px-0">
                        <WorkflowBuilder />
                      </div>
                    } />
                  </Routes>
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App