// import type { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

//   const { input_value, output_type, input_type, session_id } = req.body;

//   const SERVER_URL = process.env.SERVER_URL!;
//   const API_KEY = process.env.SERVER_API_KEY!;

//   try {
//     const apiRes = await fetch(SERVER_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-key": API_KEY,
//       },
//       body: JSON.stringify({
//         input_value,
//         output_type,
//         input_type,
//         session_id,
//       }),
//     });

//     const json = await apiRes.json();
//     res.status(apiRes.status).json(json);
//   } catch (error) {
//     console.error("Internal server error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }