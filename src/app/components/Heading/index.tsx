export default function Heading({ children }: Readonly<{ children: React.ReactNode }>) {
  
  return <h2 className={`text-black uppercase font-bold text-lg font-sans`}>{children}</h2>;
}
