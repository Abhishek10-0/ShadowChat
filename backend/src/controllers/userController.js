// Only export getProtectedUser for /protected route
export const getProtectedUser = (req, res) => {
  res.json({ userId: req.user });
}; 