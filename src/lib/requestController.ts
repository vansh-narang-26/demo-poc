let controller: AbortController | null = null;

export const getRequestController = () => {
  if (!controller) controller = new AbortController();
  return controller;
};

export const resetRequestController = () => {
  controller?.abort(); 
  controller = new AbortController(); 
};