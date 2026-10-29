-- Imagens dos e-mails (logo da Vyrex). Os programas de e-mail não mostram SVG
-- nem arquivos do site local, então o logo fica num bucket público, só de
-- imagens. Migration aditiva: nenhuma política nova; só a chave de serviço
-- envia arquivos para ele.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('email-assets', 'email-assets', true, 1048576, array['image/png'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
