import axios from "axios";

const API_BASE = "/api/v1/admin/analytics";

export const getSubscriptionsAnalytics = async ({ from, to, groupBy = "day" }, token) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (groupBy) params.groupBy = groupBy;
  const res = await axios.get(`${API_BASE}/subscriptions`, {
    params,
    headers: { Authorization: token },
  });
  return res.data;
};

export const getSubscriptionsLeaderboard = async (token) => {
  const res = await axios.get(`${API_BASE}/subscriptions/leaderboard`, {
    headers: { Authorization: token },
  });
  return res.data;
};
