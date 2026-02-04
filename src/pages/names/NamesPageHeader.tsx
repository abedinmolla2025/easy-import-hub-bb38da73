interface NamesPageHeaderProps {
  title: string;
  subtitle?: string;
}

export const NamesPageHeader = ({ title, subtitle }: NamesPageHeaderProps) => {
  return (
    <div className="text-center space-y-2 mb-6">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  );
};
