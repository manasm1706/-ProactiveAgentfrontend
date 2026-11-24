export default function Badge({children,tone='blue'}:{children:any;tone?:string}){return <span className={'badge '+tone}>{children}</span>}
