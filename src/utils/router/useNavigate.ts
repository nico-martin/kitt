const useNavigate = () => (to: string) => (window.location.hash = to);

export default useNavigate;
