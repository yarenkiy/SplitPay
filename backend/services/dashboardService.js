const dashboardRepository = require('../repositories/dashboardRepository');

class DashboardService {
  // Helper function to format time ago
  formatTimeAgo(date) {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  }

  async getDashboardData(userId) {
    // Get summary data
    const summary = await dashboardRepository.getUserSummary(userId);
    
    // Calculate balance: credit - debt (positive means you get money, negative means you owe)
    const balance = parseFloat(summary.total_credit) - parseFloat(summary.total_debt);
    
    // Get user groups
    const groups = await dashboardRepository.getUserGroups(userId);
    
    // Get recent activities
    const activities = await dashboardRepository.getRecentActivities(userId);
    
    return {
      success: true,
      data: {
        summary: {
          totalDebt: parseFloat(summary.total_debt),
          totalCredit: parseFloat(summary.total_credit),
          balance: balance
        },
        groups: groups.map(group => ({
          id: group.id,
          name: group.name,
          debt: parseFloat(group.user_balance),
          members: parseInt(group.member_count),
          color: group.color,
          inviteCode: group.invite_code
        })),
        activities: activities.map(activity => ({
          id: activity.id,
          type: 'expense',
          message: `${activity.description} - ${activity.currency_symbol || '₺'}${activity.total_amount || 0}`,
          detail: `Paid by ${activity.paid_by_name}`,
          participants: activity.participant_count,
          group: activity.group_name,
          time: this.formatTimeAgo(activity.created_at),
          icon: 'receipt-outline',
          color: activity.group_color
        }))
      }
    };
  }

  async getSummary(userId) {
    const summary = await dashboardRepository.getUserSummary(userId);
    
    // Calculate balance: credit - debt
    const balance = parseFloat(summary.total_credit) - parseFloat(summary.total_debt);
    
    return {
      success: true,
      data: {
        totalDebt: parseFloat(summary.total_debt),
        totalCredit: parseFloat(summary.total_credit),
        balance: balance
      }
    };
  }

  async getUserGroups(userId) {
    const groups = await dashboardRepository.getUserGroups(userId);
    
    return {
      success: true,
      data: groups.map(group => ({
        id: group.id,
        name: group.name,
        debt: parseFloat(group.user_balance),
        members: parseInt(group.member_count),
        color: group.color,
        inviteCode: group.invite_code
      }))
    };
  }

  async getRecentActivities(userId) {
    const activities = await dashboardRepository.getRecentActivities(userId);
    
    return {
      success: true,
      data: activities.map(activity => ({
        id: activity.id,
        type: 'expense',
        message: `${activity.description} - ${activity.currency_symbol || '₺'}${activity.total_amount || 0}`,
        detail: `Paid by ${activity.paid_by_name}`,
        participants: activity.participant_count,
        group: activity.group_name,
        time: this.formatTimeAgo(activity.created_at),
        icon: 'receipt-outline',
        color: activity.group_color
      }))
    };
  }
}

module.exports = new DashboardService();

