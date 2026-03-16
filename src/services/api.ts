const getApiUrl = () => window.location.origin;

export const login = async (email: string, password: string) => {
  const res = await fetch(`${getApiUrl()}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Falha no login");
  return res.json();
};

export const getUsers = async (token: string) => {
  const res = await fetch(`${getApiUrl()}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const createUser = async (token: string, userData: any) => {
  const res = await fetch(`${getApiUrl()}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  return res.json();
};

export const deleteUser = async (token: string, id: number) => {
  return deleteItem(token, "users", id);
};

export const deletePost = async (token: string, id: number) => {
  return deleteItem(token, "mural", id);
};

export const deletePoll = async (token: string, id: number) => {
  return deleteItem(token, "polls", id);
};

export const deleteBulletin = async (token: string, id: number) => {
  return deleteItem(token, "bulletins", id);
};

export const getStats = async (token: string) => {
  const res = await fetch(`${getApiUrl()}/api/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const uploadBulletin = async (token: string, userId: number, file: File) => {
  const formData = new FormData();
  formData.append("userId", userId.toString());
  formData.append("file", file);

  const res = await fetch(`${getApiUrl()}/api/upload-bulletin`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

export const getMyBulletins = async (token: string) => {
  const res = await fetch(`${getApiUrl()}/api/my-bulletins`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getBulletinsForUser = async (token: string, userId: number) => {
  const res = await fetch(`${getApiUrl()}/api/users/${userId}/bulletins`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getMural = async (token: string) => {
  const res = await fetch(`${getApiUrl()}/api/mural`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const createPost = async (token: string, data: { title: string, content?: string, type: string, image?: File, scheduled_date?: string }) => {
  const formData = new FormData();
  formData.append("title", data.title);
  if (data.content) formData.append("content", data.content);
  formData.append("type", data.type);
  if (data.image) formData.append("image", data.image);
  if (data.scheduled_date) formData.append("scheduled_date", data.scheduled_date);

  const res = await fetch(`${getApiUrl()}/api/mural`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

export const getPolls = async (token: string) => {
  const res = await fetch(`${getApiUrl()}/api/polls`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const createPoll = async (token: string, data: { question: string, options: string[], scheduled_date?: string }) => {
  const res = await fetch(`${getApiUrl()}/api/polls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const votePoll = async (token: string, id: number, option_index: number) => {
  const res = await fetch(`${getApiUrl()}/api/polls/${id}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ option_index }),
  });
  return res.json();
};

export const dismissPoll = async (token: string, id: number) => {
  const res = await fetch(`${getApiUrl()}/api/polls/${id}/dismiss`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const deleteItem = async (token: string, type: string, id: number) => {
  const res = await fetch(`${getApiUrl()}/api/${type}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(errorData.error || `Falha ao excluir ${type}`);
  }
  
  return res.json();
};
