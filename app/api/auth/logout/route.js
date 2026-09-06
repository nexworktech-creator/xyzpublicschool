export async function POST() {
  const res = Response.json({ message: "Logged out" });
  res.headers.set(
    "Set-Cookie",
    "school_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );
  return res;
}
