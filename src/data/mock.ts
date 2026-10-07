import type { DashboardData } from '../types/tool'

// Données identiques au mockup (mode par défaut, sans API)
export const mockDashboard: DashboardData = {
  kpis: [
    { id: 'budget', label: 'Monthly Budget', value: 28750, format: 'currency', target: 30000, trend: '+12%', tone: 'green', icon: 'budget' },
    { id: 'tools', label: 'Active Tools', value: 147, format: 'number', trend: '+8', tone: 'blue', icon: 'tools' },
    { id: 'departments', label: 'Departments', value: 8, format: 'number', trend: '+2', tone: 'orange', icon: 'departments' },
    { id: 'cost-per-user', label: 'Cost/User', value: 156, format: 'currency', trend: '-€12', tone: 'pink', icon: 'cost' },
  ],
  tools: [
    { id: 1, name: 'Slack', icon: '💬', department: 'Communication', users: 245, monthlyCost: 2450, status: 'active' },
    { id: 2, name: 'Figma', icon: '🎨', department: 'Design', users: 32, monthlyCost: 480, status: 'active' },
    { id: 3, name: 'GitHub', icon: '⚡', department: 'Engineering', users: 89, monthlyCost: 890, status: 'active' },
    { id: 4, name: 'Notion', icon: '📝', department: 'Operations', users: 156, monthlyCost: 780, status: 'expiring' },
    { id: 5, name: 'Adobe CC', icon: '🎭', department: 'Marketing', users: 12, monthlyCost: 720, status: 'unused' },
    { id: 6, name: 'Zoom', icon: '📹', department: 'Communication', users: 198, monthlyCost: 1980, status: 'active' },
    { id: 7, name: 'Jira', icon: '🔧', department: 'Engineering', users: 67, monthlyCost: 670, status: 'expiring' },
    { id: 8, name: 'Salesforce', icon: '💼', department: 'Sales', users: 45, monthlyCost: 4500, status: 'active' },
  ],
}
