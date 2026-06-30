export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-muted/40 flex min-h-[calc(100svh-3rem)] w-full justify-center px-4 py-8'>
      <div className='border-border bg-background relative flex h-[820px] w-[390px] flex-col overflow-hidden rounded-[2.25rem] border-8 shadow-xl'>
        <div className='bg-background flex h-7 shrink-0 items-center justify-center'>
          <div className='bg-border h-1.5 w-20 rounded-full' />
        </div>
        <div className='flex-1 overflow-y-auto'>{children}</div>
      </div>
    </div>
  );
}
