import type { Kpi, Tool, ToolStatus } from '../types/tool'

export const mockKpis: Kpi[] = [
  { id: 'budget', label: 'Monthly Budget', value: 28750, format: 'currency', target: 30000, trend: '+12%', tone: 'green', icon: 'budget' },
  { id: 'tools', label: 'Active Tools', value: 147, format: 'number', trend: '+8', tone: 'blue', icon: 'tools' },
  { id: 'departments', label: 'Departments', value: 8, format: 'number', trend: '+2', tone: 'orange', icon: 'departments' },
  { id: 'cost-per-user', label: 'Cost/User', value: 156, format: 'currency', trend: '-€12', tone: 'pink', icon: 'cost' },
]

type Row = [name: string, icon: string, description: string, vendor: string, category: string, department: string, users: number, cost: number, status: ToolStatus, daysAgo: number, url: string]

const ROWS: Row[] = [
  ['Slack', '💬', 'Team messaging and channels for company-wide communication', 'Slack Technologies', 'Communication', 'Communication', 245, 2450, 'active', 1, 'https://slack.com'],
  ['Figma', '🎨', 'Collaborative interface design and prototyping', 'Figma Inc.', 'Design', 'Design', 32, 480, 'active', 2, 'https://figma.com'],
  ['GitHub', '⚡', 'Source code hosting, code review and CI workflows', 'GitHub Inc.', 'Development', 'Engineering', 89, 890, 'active', 3, 'https://github.com'],
  ['Notion', '📝', 'Docs, wikis and project notes in a single workspace', 'Notion Labs', 'Productivity', 'Operations', 156, 780, 'expiring', 5, 'https://notion.so'],
  ['Adobe CC', '🎭', 'Creative suite for photo, video and graphic production', 'Adobe Systems', 'Design', 'Marketing', 12, 720, 'unused', 7, 'https://adobe.com'],
  ['Zoom', '📹', 'Video meetings and webinars for distributed teams', 'Zoom Video Communications', 'Communication', 'Communication', 198, 1980, 'active', 9, 'https://zoom.us'],
  ['Jira', '🔧', 'Issue tracking and sprint planning for software teams', 'Atlassian', 'Development', 'Engineering', 67, 670, 'expiring', 12, 'https://atlassian.com/software/jira'],
  ['Salesforce', '💼', 'CRM platform for pipeline, accounts and forecasting', 'Salesforce Inc.', 'Sales', 'Sales', 45, 4500, 'active', 15, 'https://salesforce.com'],
  ['Microsoft 365', '🗂️', 'Office apps, email and cloud storage suite', 'Microsoft', 'Productivity', 'Operations', 210, 2100, 'active', 45, 'https://microsoft.com/microsoft-365'],
  ['Google Workspace', '📧', 'Email, calendar and shared documents', 'Google', 'Productivity', 'Operations', 180, 1260, 'active', 52, 'https://workspace.google.com'],
  ['HubSpot', '🧲', 'Marketing automation and lead nurturing', 'HubSpot Inc.', 'Marketing', 'Marketing', 28, 1120, 'active', 38, 'https://hubspot.com'],
  ['Datadog', '🐶', 'Infrastructure monitoring and application tracing', 'Datadog Inc.', 'Development', 'Engineering', 41, 1640, 'active', 60, 'https://datadoghq.com'],
  ['1Password', '🔐', 'Shared password vaults and secure sign-in', '1Password', 'Security', 'Operations', 190, 760, 'active', 75, 'https://1password.com'],
  ['Asana', '✅', 'Task boards and cross-team project tracking', 'Asana Inc.', 'Productivity', 'Operations', 22, 264, 'unused', 90, 'https://asana.com'],
  ['Canva', '🖌️', 'Quick graphics and social media templates', 'Canva Pty', 'Design', 'Marketing', 15, 195, 'expiring', 33, 'https://canva.com'],
  ['QuickBooks', '💶', 'Accounting, invoicing and expense reports', 'Intuit', 'Finance', 'Finance', 6, 330, 'active', 120, 'https://quickbooks.intuit.com'],
  ['BambooHR', '👥', 'Employee records, leave and onboarding', 'BambooHR', 'Productivity', 'HR', 14, 420, 'active', 41, 'https://bamboohr.com'],
  ['Mailchimp', '🐵', 'Email newsletters and audience segments', 'Intuit Mailchimp', 'Marketing', 'Marketing', 9, 299, 'unused', 66, 'https://mailchimp.com'],
  ['Zendesk', '🎧', 'Customer support tickets and help center', 'Zendesk Inc.', 'Communication', 'Operations', 34, 986, 'disabled', 80, 'https://zendesk.com'],
  ['Miro', '🗺️', 'Online whiteboard for workshops and brainstorming', 'Miro', 'Design', 'Design', 48, 576, 'expiring', 36, 'https://miro.com'],
]

const DAY = 86_400_000

export function buildSeedTools(now = Date.now()): Tool[] {
  return ROWS.map(([name, icon, description, vendor, category, department, users, monthlyCost, status, daysAgo, websiteUrl], index) => ({
    id: index + 1,
    name,
    icon,
    description,
    vendor,
    category,
    department,
    users,
    monthlyCost,
    status,
    websiteUrl,
    lastUpdate: new Date(now - daysAgo * DAY).toISOString(),
  }))
}
