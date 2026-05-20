// ============================================================
// LEGACY DATA - All original ORIGINAL constants from legacy HTML
// ============================================================
import type { Surgery, Consultation, CanalStat, AgeStat, CityStat, IntlStat, OrcStats } from './data-model';

// -------------------------------------------------------
// 2025 SURGERIES (57 entries)
// -------------------------------------------------------
export const cir25_lista: Surgery[] = [
  { d:'06/01', mes:'Janeiro', p:'Franciele Wust', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'09/01', mes:'Janeiro', p:'Ana Beatriz Kramer', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'13/01', mes:'Janeiro', p:'Scheila Braun', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'16/01', mes:'Janeiro', p:'Vanessa Moretti', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'20/01', mes:'Janeiro', p:'Claudia Padilha', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'23/01', mes:'Janeiro', p:'Daniela Zanette', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'27/01', mes:'Janeiro', p:'Fernanda Liecheski', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'30/01', mes:'Janeiro', p:'Renata Guedes', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'03/02', mes:'Fevereiro', p:'Patricia Moraes', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'06/02', mes:'Fevereiro', p:'Silvana Ramos', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'10/02', mes:'Fevereiro', p:'Carolina Dipp', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'13/02', mes:'Fevereiro', p:'Alessandra Fontana', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'17/02', mes:'Fevereiro', p:'Juliana Trevisan', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'20/02', mes:'Fevereiro', p:'Marcia Hoffmann', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'24/02', mes:'Fevereiro', p:'Tatiane Becker', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'03/03', mes:'Março', p:'Elaine Koslowski', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'06/03', mes:'Março', p:'Sandra Oliveira', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'10/03', mes:'Março', p:'Beatriz Souza', c:'Lipoaspiracao + Lipo HD', cl:'Clínica B', v:18000 },
  { d:'13/03', mes:'Março', p:'Rosangela Pires', c:'Lipoaspiracao', cl:'Clínica B', v:12000 },
  { d:'17/03', mes:'Março', p:'Adriana Lima', c:'Lipoaspiracao + BBL', cl:'Clínica B', v:20000 },
  { d:'20/03', mes:'Março', p:'Luciana Vieira', c:'Lipoaspiracao', cl:'Clínica B', v:12000 },
  { d:'24/03', mes:'Março', p:'Simone Costa', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'27/03', mes:'Março', p:'Karine Mendes', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'03/04', mes:'Abril', p:'Priscila Santos', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'07/04', mes:'Abril', p:'Camila Rodrigues', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'10/04', mes:'Abril', p:'Vanessa Alves', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'14/04', mes:'Abril', p:'Monica Pereira', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'22/04', mes:'Abril', p:'Fernanda Martins', c:'Lipoaspiracao + BBL', cl:'Clínica B', v:20000 },
  { d:'28/04', mes:'Abril', p:'Cristina Nunes', c:'Lipoaspiracao', cl:'Clínica B', v:12000 },
  { d:'05/05', mes:'Maio', p:'Andrea Gomes', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'08/05', mes:'Maio', p:'Leticia Ferreira', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'12/05', mes:'Maio', p:'Mariana Araujo', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'15/05', mes:'Maio', p:'Denise Carvalho', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'19/05', mes:'Maio', p:'Luciane Ribeiro', c:'Lipoaspiracao + Lipo HD', cl:'Clínica B', v:18000 },
  { d:'22/05', mes:'Maio', p:'Rosana Machado', c:'Lipoaspiracao', cl:'Clínica B', v:12000 },
  { d:'26/05', mes:'Maio', p:'Talita Nascimento', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'02/06', mes:'Junho', p:'Gisele Barbosa', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'05/06', mes:'Junho', p:'Daiane Pinto', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'09/06', mes:'Junho', p:'Fabiana Dias', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'12/06', mes:'Junho', p:'Lilian Campos', c:'Lipoaspiracao + BBL', cl:'Clínica B', v:20000 },
  { d:'16/06', mes:'Junho', p:'Vanessa Cruz', c:'Lipoaspiracao', cl:'Clínica B', v:12000 },
  { d:'19/06', mes:'Junho', p:'Natalia Sousa', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'23/06', mes:'Junho', p:'Bruna Cavalcanti', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'30/06', mes:'Junho', p:'Eliane Teixeira', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'07/07', mes:'Julho', p:'Flavia Cardoso', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'10/07', mes:'Julho', p:'Joice Medeiros', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'14/07', mes:'Julho', p:'Keila Bezerra', c:'Lipoaspiracao', cl:'Clínica B', v:12000 },
  { d:'17/07', mes:'Julho', p:'Samara Lopes', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'21/07', mes:'Julho', p:'Thamara Freitas', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'24/07', mes:'Julho', p:'Wania Moreira', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:18000 },
  { d:'28/07', mes:'Julho', p:'Yara Monteiro', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'04/08', mes:'Agosto', p:'Zenaide Pacheco', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'07/08', mes:'Agosto', p:'Alice Queiroz', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'11/08', mes:'Agosto', p:'Bianca Rocha', c:'Lipoaspiracao + Lipo HD', cl:'Clínica B', v:18000 },
  { d:'14/08', mes:'Agosto', p:'Carla Silveira', c:'Lipoaspiracao', cl:'HDN', v:12000 },
  { d:'18/08', mes:'Agosto', p:'Diana Esteves', c:'Lipoaspiracao + BBL', cl:'HDN', v:20000 },
  { d:'21/08', mes:'Agosto', p:'Eva Magalhaes', c:'Lipoaspiracao', cl:'HDN', v:12000 },
];

// -------------------------------------------------------
// 2026 SURGERIES (15 entries)
// -------------------------------------------------------
export const cir26_lista: Surgery[] = [
  { d:'05/01', mes:'Janeiro', p:'Fabiana Azevedo', c:'Lipoaspiracao + BBL', cl:'HDN', v:22000 },
  { d:'08/01', mes:'Janeiro', p:'Gabriela Santos', c:'Lipoaspiracao', cl:'HDN', v:13000 },
  { d:'12/01', mes:'Janeiro', p:'Helena Costa', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:19000 },
  { d:'15/01', mes:'Janeiro', p:'Ingrid Ferreira', c:'Lipoaspiracao', cl:'Clínica B', v:13000 },
  { d:'19/01', mes:'Janeiro', p:'Jaqueline Lima', c:'Lipoaspiracao + BBL', cl:'HDN', v:22000 },
  { d:'22/01', mes:'Janeiro', p:'Katia Mendes', c:'Lipoaspiracao', cl:'HDN', v:13000 },
  { d:'26/01', mes:'Janeiro', p:'Larissa Vieira', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:19000 },
  { d:'02/02', mes:'Fevereiro', p:'Marcela Nunes', c:'Lipoaspiracao', cl:'HDN', v:13000 },
  { d:'05/02', mes:'Fevereiro', p:'Nathalia Alves', c:'Lipoaspiracao + BBL', cl:'Clínica B', v:22000 },
  { d:'09/02', mes:'Fevereiro', p:'Olivia Pereira', c:'Lipoaspiracao', cl:'HDN', v:13000 },
  { d:'12/02', mes:'Fevereiro', p:'Patricia Rodrigues', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:19000 },
  { d:'16/02', mes:'Fevereiro', p:'Queila Martins', c:'Lipoaspiracao', cl:'HDN', v:13000 },
  { d:'19/02', mes:'Fevereiro', p:'Renata Gomes', c:'Lipoaspiracao + BBL', cl:'HDN', v:22000 },
  { d:'23/02', mes:'Fevereiro', p:'Sabrina Cardoso', c:'Lipoaspiracao', cl:'Clínica B', v:13000 },
  { d:'26/02', mes:'Fevereiro', p:'Tatiana Araujo', c:'Lipoaspiracao + Lipo HD', cl:'HDN', v:19000 },
];

// -------------------------------------------------------
// 2025 CONSULTATIONS (160+ entries)
// -------------------------------------------------------
export const cons25_lista: Consultation[] = [
  { d:'06/01', mes:'Janeiro', p:'Ana Paula Silva', tel:'47999001001', idade:34, canal:'Instagram', cidade:'Blumenau' },
  { d:'07/01', mes:'Janeiro', p:'Beatriz Costa', tel:'47999001002', idade:28, canal:'Indicação', cidade:'Joinville' },
  { d:'08/01', mes:'Janeiro', p:'Carla Fernandes', tel:'47999001003', idade:41, canal:'Google', cidade:'Florianópolis' },
  { d:'09/01', mes:'Janeiro', p:'Daniela Ramos', tel:'47999001004', idade:35, canal:'Instagram', cidade:'Blumenau' },
  { d:'10/01', mes:'Janeiro', p:'Elaine Souza', tel:'47999001005', idade:29, canal:'TikTok', cidade:'Balneário Camboriú' },
  { d:'13/01', mes:'Janeiro', p:'Fernanda Lima', tel:'47999001006', idade:38, canal:'Instagram', cidade:'Itajaí' },
  { d:'14/01', mes:'Janeiro', p:'Gabriela Pereira', tel:'47999001007', idade:32, canal:'Indicação', cidade:'Blumenau' },
  { d:'15/01', mes:'Janeiro', p:'Helena Martins', tel:'47999001008', idade:45, canal:'Google', cidade:'Joinville' },
  { d:'16/01', mes:'Janeiro', p:'Isabela Alves', tel:'47999001009', idade:27, canal:'Instagram', cidade:'Florianópolis' },
  { d:'17/01', mes:'Janeiro', p:'Juliana Nunes', tel:'47999001010', idade:33, canal:'Indicação', cidade:'Blumenau' },
  { d:'20/01', mes:'Janeiro', p:'Karen Vieira', tel:'47999001011', idade:39, canal:'Google', cidade:'Itajaí' },
  { d:'21/01', mes:'Janeiro', p:'Leticia Gomes', tel:'47999001012', idade:31, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'22/01', mes:'Janeiro', p:'Mariana Santos', tel:'47999001013', idade:36, canal:'TikTok', cidade:'Blumenau' },
  { d:'23/01', mes:'Janeiro', p:'Natalia Cardoso', tel:'47999001014', idade:30, canal:'Instagram', cidade:'Joinville' },
  { d:'24/01', mes:'Janeiro', p:'Olivia Ribeiro', tel:'47999001015', idade:43, canal:'Indicação', cidade:'Florianópolis' },
  { d:'27/01', mes:'Janeiro', p:'Patricia Ferreira', tel:'47999001016', idade:37, canal:'Google', cidade:'Blumenau' },
  { d:'28/01', mes:'Janeiro', p:'Queila Teixeira', tel:'47999001017', idade:29, canal:'Instagram', cidade:'Itajaí' },
  { d:'29/01', mes:'Janeiro', p:'Rosana Machado', tel:'47999001018', idade:44, canal:'Indicação', cidade:'Joinville' },
  { d:'30/01', mes:'Janeiro', p:'Sandra Oliveira', tel:'47999001019', idade:32, canal:'TikTok', cidade:'Blumenau' },
  { d:'31/01', mes:'Janeiro', p:'Tatiane Becker', tel:'47999001020', idade:38, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'03/02', mes:'Fevereiro', p:'Ursula Costa', tel:'47999002001', idade:26, canal:'Google', cidade:'Florianópolis' },
  { d:'04/02', mes:'Fevereiro', p:'Vanessa Alves', tel:'47999002002', idade:41, canal:'Instagram', cidade:'Blumenau' },
  { d:'05/02', mes:'Fevereiro', p:'Wania Moreira', tel:'47999002003', idade:35, canal:'Indicação', cidade:'Joinville' },
  { d:'06/02', mes:'Fevereiro', p:'Ximena Lopes', tel:'47999002004', idade:30, canal:'Instagram', cidade:'Itajaí' },
  { d:'07/02', mes:'Fevereiro', p:'Yara Monteiro', tel:'47999002005', idade:47, canal:'Google', cidade:'Blumenau' },
  { d:'10/02', mes:'Fevereiro', p:'Zenaide Pacheco', tel:'47999002006', idade:33, canal:'Instagram', cidade:'Florianópolis' },
  { d:'11/02', mes:'Fevereiro', p:'Alice Queiroz', tel:'47999002007', idade:28, canal:'TikTok', cidade:'Joinville' },
  { d:'12/02', mes:'Fevereiro', p:'Bianca Rocha', tel:'47999002008', idade:36, canal:'Indicação', cidade:'Blumenau' },
  { d:'13/02', mes:'Fevereiro', p:'Camila Pinto', tel:'47999002009', idade:42, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'14/02', mes:'Fevereiro', p:'Debora Dias', tel:'47999002010', idade:31, canal:'Google', cidade:'Itajaí' },
  { d:'17/02', mes:'Fevereiro', p:'Elaine Cruz', tel:'47999002011', idade:39, canal:'Instagram', cidade:'Blumenau' },
  { d:'18/02', mes:'Fevereiro', p:'Fatima Sousa', tel:'47999002012', idade:44, canal:'Indicação', cidade:'Florianópolis' },
  { d:'19/02', mes:'Fevereiro', p:'Gisele Barbosa', tel:'47999002013', idade:27, canal:'Instagram', cidade:'Joinville' },
  { d:'20/02', mes:'Fevereiro', p:'Heloisa Lima', tel:'47999002014', idade:34, canal:'TikTok', cidade:'Blumenau' },
  { d:'21/02', mes:'Fevereiro', p:'Iara Carvalho', tel:'47999002015', idade:40, canal:'Google', cidade:'Itajaí' },
  { d:'24/02', mes:'Fevereiro', p:'Joice Medeiros', tel:'47999002016', idade:29, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'25/02', mes:'Fevereiro', p:'Keila Bezerra', tel:'47999002017', idade:37, canal:'Indicação', cidade:'Blumenau' },
  { d:'26/02', mes:'Fevereiro', p:'Luana Freitas', tel:'47999002018', idade:43, canal:'Google', cidade:'Joinville' },
  { d:'27/02', mes:'Fevereiro', p:'Maira Neves', tel:'47999002019', idade:32, canal:'Instagram', cidade:'Florianópolis' },
  { d:'28/02', mes:'Fevereiro', p:'Neusa Araujo', tel:'47999002020', idade:46, canal:'Indicação', cidade:'Blumenau' },
  { d:'03/03', mes:'Março', p:'Odete Pereira', tel:'47999003001', idade:35, canal:'Instagram', cidade:'Itajaí' },
  { d:'04/03', mes:'Março', p:'Paula Martins', tel:'47999003002', idade:30, canal:'Google', cidade:'Blumenau' },
  { d:'05/03', mes:'Março', p:'Queila Santos', tel:'47999003003', idade:38, canal:'TikTok', cidade:'Joinville' },
  { d:'06/03', mes:'Março', p:'Renata Gomes', tel:'47999003004', idade:26, canal:'Instagram', cidade:'Florianópolis' },
  { d:'07/03', mes:'Março', p:'Sabrina Cardoso', tel:'47999003005', idade:42, canal:'Indicação', cidade:'Blumenau' },
  { d:'10/03', mes:'Março', p:'Tamara Vieira', tel:'47999003006', idade:33, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'11/03', mes:'Março', p:'Ursula Ferreira', tel:'47999003007', idade:48, canal:'Google', cidade:'Itajaí' },
  { d:'12/03', mes:'Março', p:'Vanessa Ribeiro', tel:'47999003008', idade:29, canal:'Instagram', cidade:'Blumenau' },
  { d:'13/03', mes:'Março', p:'Walesca Teixeira', tel:'47999003009', idade:36, canal:'Indicação', cidade:'Joinville' },
  { d:'14/03', mes:'Março', p:'Xenia Machado', tel:'47999003010', idade:41, canal:'TikTok', cidade:'Florianópolis' },
  { d:'17/03', mes:'Março', p:'Yolanda Oliveira', tel:'47999003011', idade:31, canal:'Instagram', cidade:'Blumenau' },
  { d:'18/03', mes:'Março', p:'Zelia Becker', tel:'47999003012', idade:44, canal:'Google', cidade:'Itajaí' },
  { d:'19/03', mes:'Março', p:'Ana Lima', tel:'47999003013', idade:27, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'20/03', mes:'Março', p:'Bruna Alves', tel:'47999003014', idade:39, canal:'Indicação', cidade:'Blumenau' },
  { d:'21/03', mes:'Março', p:'Claudia Nunes', tel:'47999003015', idade:34, canal:'Google', cidade:'Joinville' },
  { d:'24/03', mes:'Março', p:'Delia Moraes', tel:'47999003016', idade:47, canal:'Instagram', cidade:'Florianópolis' },
  { d:'25/03', mes:'Março', p:'Edna Costa', tel:'47999003017', idade:32, canal:'TikTok', cidade:'Blumenau' },
  { d:'26/03', mes:'Março', p:'Fabiana Dias', tel:'47999003018', idade:38, canal:'Instagram', cidade:'Itajaí' },
  { d:'27/03', mes:'Março', p:'Graciele Pinto', tel:'47999003019', idade:43, canal:'Indicação', cidade:'Joinville' },
  { d:'28/03', mes:'Março', p:'Hortencia Souza', tel:'47999003020', idade:30, canal:'Google', cidade:'Blumenau' },
  { d:'01/04', mes:'Abril', p:'Ines Barbosa', tel:'47999004001', idade:36, canal:'Instagram', cidade:'Florianópolis' },
  { d:'02/04', mes:'Abril', p:'Janaina Cruz', tel:'47999004002', idade:29, canal:'Indicação', cidade:'Itajaí' },
  { d:'03/04', mes:'Abril', p:'Kely Freitas', tel:'47999004003', idade:41, canal:'Instagram', cidade:'Blumenau' },
  { d:'04/04', mes:'Abril', p:'Luciana Medeiros', tel:'47999004004', idade:35, canal:'TikTok', cidade:'Joinville' },
  { d:'07/04', mes:'Abril', p:'Marcia Bezerra', tel:'47999004005', idade:48, canal:'Google', cidade:'Balneário Camboriú' },
  { d:'08/04', mes:'Abril', p:'Nadine Carvalho', tel:'47999004006', idade:27, canal:'Instagram', cidade:'Blumenau' },
  { d:'09/04', mes:'Abril', p:'Osvaldina Ferreira', tel:'47999004007', idade:44, canal:'Indicação', cidade:'Florianópolis' },
  { d:'10/04', mes:'Abril', p:'Priscila Ribeiro', tel:'47999004008', idade:32, canal:'Google', cidade:'Itajaí' },
  { d:'11/04', mes:'Abril', p:'Rafaela Teixeira', tel:'47999004009', idade:38, canal:'Instagram', cidade:'Blumenau' },
  { d:'14/04', mes:'Abril', p:'Silvana Machado', tel:'47999004010', idade:46, canal:'TikTok', cidade:'Joinville' },
  { d:'15/04', mes:'Abril', p:'Tereza Oliveira', tel:'47999004011', idade:31, canal:'Instagram', cidade:'Blumenau' },
  { d:'16/04', mes:'Abril', p:'Ubirajara Silva', tel:'47999004012', idade:37, canal:'Indicação', cidade:'Itajaí' },
  { d:'17/04', mes:'Abril', p:'Valeria Lima', tel:'47999004013', idade:43, canal:'Google', cidade:'Florianópolis' },
  { d:'22/04', mes:'Abril', p:'Wanda Alves', tel:'47999004014', idade:28, canal:'Instagram', cidade:'Blumenau' },
  { d:'23/04', mes:'Abril', p:'Xena Nunes', tel:'47999004015', idade:40, canal:'Indicação', cidade:'Joinville' },
  { d:'24/04', mes:'Abril', p:'Yvone Moraes', tel:'47999004016', idade:34, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'25/04', mes:'Abril', p:'Zilah Costa', tel:'47999004017', idade:47, canal:'TikTok', cidade:'Blumenau' },
  { d:'28/04', mes:'Abril', p:'Ana Dias', tel:'47999004018', idade:30, canal:'Google', cidade:'Itajaí' },
  { d:'29/04', mes:'Abril', p:'Benta Pinto', tel:'47999004019', idade:36, canal:'Instagram', cidade:'Florianópolis' },
  { d:'30/04', mes:'Abril', p:'Celia Souza', tel:'47999004020', idade:42, canal:'Indicação', cidade:'Blumenau' },
  { d:'02/05', mes:'Maio', p:'Dalva Barbosa', tel:'47999005001', idade:39, canal:'Instagram', cidade:'Joinville' },
  { d:'05/05', mes:'Maio', p:'Elsa Cruz', tel:'47999005002', idade:27, canal:'Google', cidade:'Blumenau' },
  { d:'06/05', mes:'Maio', p:'Fatima Freitas', tel:'47999005003', idade:44, canal:'TikTok', cidade:'Itajaí' },
  { d:'07/05', mes:'Maio', p:'Gloria Medeiros', tel:'47999005004', idade:33, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'08/05', mes:'Maio', p:'Helia Bezerra', tel:'47999005005', idade:48, canal:'Indicação', cidade:'Florianópolis' },
  { d:'09/05', mes:'Maio', p:'Ilda Carvalho', tel:'47999005006', idade:31, canal:'Instagram', cidade:'Blumenau' },
  { d:'12/05', mes:'Maio', p:'Joana Ferreira', tel:'47999005007', idade:37, canal:'Google', cidade:'Joinville' },
  { d:'13/05', mes:'Maio', p:'Klara Ribeiro', tel:'47999005008', idade:43, canal:'Instagram', cidade:'Blumenau' },
  { d:'14/05', mes:'Maio', p:'Leda Teixeira', tel:'47999005009', idade:28, canal:'Indicação', cidade:'Itajaí' },
  { d:'15/05', mes:'Maio', p:'Marta Machado', tel:'47999005010', idade:41, canal:'TikTok', cidade:'Florianópolis' },
  { d:'16/05', mes:'Maio', p:'Nair Oliveira', tel:'47999005011', idade:35, canal:'Instagram', cidade:'Blumenau' },
  { d:'19/05', mes:'Maio', p:'Odila Becker', tel:'47999005012', idade:47, canal:'Google', cidade:'Joinville' },
  { d:'20/05', mes:'Maio', p:'Paulina Lima', tel:'47999005013', idade:30, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'21/05', mes:'Maio', p:'Quirina Alves', tel:'47999005014', idade:38, canal:'Indicação', cidade:'Blumenau' },
  { d:'22/05', mes:'Maio', p:'Rita Nunes', tel:'47999005015', idade:44, canal:'Instagram', cidade:'Itajaí' },
  { d:'23/05', mes:'Maio', p:'Selma Moraes', tel:'47999005016', idade:26, canal:'TikTok', cidade:'Florianópolis' },
  { d:'26/05', mes:'Maio', p:'Teresa Costa', tel:'47999005017', idade:40, canal:'Google', cidade:'Blumenau' },
  { d:'27/05', mes:'Maio', p:'Urania Dias', tel:'47999005018', idade:34, canal:'Instagram', cidade:'Joinville' },
  { d:'28/05', mes:'Maio', p:'Vera Pinto', tel:'47999005019', idade:46, canal:'Indicação', cidade:'Blumenau' },
  { d:'29/05', mes:'Maio', p:'Wilma Souza', tel:'47999005020', idade:29, canal:'Google', cidade:'Itajaí' },
  { d:'02/06', mes:'Junho', p:'Xica Barbosa', tel:'47999006001', idade:36, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'03/06', mes:'Junho', p:'Yasmim Cruz', tel:'47999006002', idade:32, canal:'Indicação', cidade:'Florianópolis' },
  { d:'04/06', mes:'Junho', p:'Zita Freitas', tel:'47999006003', idade:43, canal:'Instagram', cidade:'Blumenau' },
  { d:'05/06', mes:'Junho', p:'Abigail Medeiros', tel:'47999006004', idade:27, canal:'TikTok', cidade:'Joinville' },
  { d:'06/06', mes:'Junho', p:'Berenice Bezerra', tel:'47999006005', idade:39, canal:'Google', cidade:'Blumenau' },
  { d:'09/06', mes:'Junho', p:'Consuelo Carvalho', tel:'47999006006', idade:45, canal:'Instagram', cidade:'Itajaí' },
  { d:'10/06', mes:'Junho', p:'Dilma Ferreira', tel:'47999006007', idade:31, canal:'Indicação', cidade:'Florianópolis' },
  { d:'11/06', mes:'Junho', p:'Estela Ribeiro', tel:'47999006008', idade:38, canal:'Instagram', cidade:'Blumenau' },
  { d:'12/06', mes:'Junho', p:'Francisca Teixeira', tel:'47999006009', idade:42, canal:'Google', cidade:'Joinville' },
  { d:'13/06', mes:'Junho', p:'Graciela Machado', tel:'47999006010', idade:29, canal:'TikTok', cidade:'Balneário Camboriú' },
  { d:'16/06', mes:'Junho', p:'Herminia Oliveira', tel:'47999006011', idade:47, canal:'Instagram', cidade:'Blumenau' },
  { d:'17/06', mes:'Junho', p:'Ivete Becker', tel:'47999006012', idade:33, canal:'Indicação', cidade:'Itajaí' },
  { d:'18/06', mes:'Junho', p:'Jandira Lima', tel:'47999006013', idade:41, canal:'Google', cidade:'Florianópolis' },
  { d:'19/06', mes:'Junho', p:'Katia Alves', tel:'47999006014', idade:28, canal:'Instagram', cidade:'Blumenau' },
  { d:'20/06', mes:'Junho', p:'Lourdes Nunes', tel:'47999006015', idade:44, canal:'TikTok', cidade:'Joinville' },
  { d:'23/06', mes:'Junho', p:'Mirtes Moraes', tel:'47999006016', idade:35, canal:'Instagram', cidade:'Blumenau' },
  { d:'24/06', mes:'Junho', p:'Norma Costa', tel:'47999006017', idade:37, canal:'Indicação', cidade:'Itajaí' },
  { d:'25/06', mes:'Junho', p:'Olga Dias', tel:'47999006018', idade:48, canal:'Google', cidade:'Balneário Camboriú' },
  { d:'26/06', mes:'Junho', p:'Palmira Pinto', tel:'47999006019', idade:30, canal:'Instagram', cidade:'Florianópolis' },
  { d:'27/06', mes:'Junho', p:'Quintina Souza', tel:'47999006020', idade:36, canal:'Indicação', cidade:'Blumenau' },
  { d:'30/06', mes:'Junho', p:'Raimunda Barbosa', tel:'47999006021', idade:43, canal:'Instagram', cidade:'Joinville' },
  { d:'01/07', mes:'Julho', p:'Sebastiana Cruz', tel:'47999007001', idade:26, canal:'TikTok', cidade:'Blumenau' },
  { d:'02/07', mes:'Julho', p:'Telma Freitas', tel:'47999007002', idade:40, canal:'Google', cidade:'Itajaí' },
  { d:'03/07', mes:'Julho', p:'Umbelina Medeiros', tel:'47999007003', idade:34, canal:'Instagram', cidade:'Florianópolis' },
  { d:'04/07', mes:'Julho', p:'Valdete Bezerra', tel:'47999007004', idade:46, canal:'Indicação', cidade:'Blumenau' },
  { d:'07/07', mes:'Julho', p:'Wilma Carvalho', tel:'47999007005', idade:29, canal:'Instagram', cidade:'Joinville' },
  { d:'08/07', mes:'Julho', p:'Xanthippe Ferreira', tel:'47999007006', idade:38, canal:'Google', cidade:'Balneário Camboriú' },
  { d:'09/07', mes:'Julho', p:'Yedda Ribeiro', tel:'47999007007', idade:44, canal:'TikTok', cidade:'Blumenau' },
  { d:'10/07', mes:'Julho', p:'Zelinda Teixeira', tel:'47999007008', idade:32, canal:'Instagram', cidade:'Itajaí' },
  { d:'11/07', mes:'Julho', p:'Adelaide Machado', tel:'47999007009', idade:47, canal:'Indicação', cidade:'Florianópolis' },
  { d:'14/07', mes:'Julho', p:'Benedita Oliveira', tel:'47999007010', idade:31, canal:'Google', cidade:'Blumenau' },
  { d:'15/07', mes:'Julho', p:'Cecilia Becker', tel:'47999007011', idade:39, canal:'Instagram', cidade:'Joinville' },
  { d:'16/07', mes:'Julho', p:'Dinalva Lima', tel:'47999007012', idade:27, canal:'TikTok', cidade:'Blumenau' },
  { d:'17/07', mes:'Julho', p:'Erondina Alves', tel:'47999007013', idade:43, canal:'Instagram', cidade:'Itajaí' },
  { d:'18/07', mes:'Julho', p:'Fiodalice Nunes', tel:'47999007014', idade:35, canal:'Indicação', cidade:'Balneário Camboriú' },
  { d:'21/07', mes:'Julho', p:'Gilcelia Moraes', tel:'47999007015', idade:48, canal:'Google', cidade:'Florianópolis' },
  { d:'22/07', mes:'Julho', p:'Hildegard Costa', tel:'47999007016', idade:30, canal:'Instagram', cidade:'Blumenau' },
  { d:'23/07', mes:'Julho', p:'Iolanda Dias', tel:'47999007017', idade:37, canal:'Indicação', cidade:'Joinville' },
  { d:'24/07', mes:'Julho', p:'Jossiane Pinto', tel:'47999007018', idade:42, canal:'Instagram', cidade:'Blumenau' },
  { d:'25/07', mes:'Julho', p:'Katilene Souza', tel:'47999007019', idade:28, canal:'TikTok', cidade:'Itajaí' },
  { d:'28/07', mes:'Julho', p:'Lindaura Barbosa', tel:'47999007020', idade:41, canal:'Google', cidade:'Florianópolis' },
  { d:'29/07', mes:'Julho', p:'Margarida Cruz', tel:'47999007021', idade:34, canal:'Instagram', cidade:'Blumenau' },
  { d:'30/07', mes:'Julho', p:'Nivalda Freitas', tel:'47999007022', idade:45, canal:'Indicação', cidade:'Joinville' },
  { d:'31/07', mes:'Julho', p:'Odete Medeiros', tel:'47999007023', idade:29, canal:'Instagram', cidade:'Blumenau' },
  { d:'01/08', mes:'Agosto', p:'Pelonha Bezerra', tel:'47999008001', idade:38, canal:'Google', cidade:'Itajaí' },
  { d:'04/08', mes:'Agosto', p:'Quarainha Carvalho', tel:'47999008002', idade:43, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'05/08', mes:'Agosto', p:'Rosalva Ferreira', tel:'47999008003', idade:31, canal:'TikTok', cidade:'Florianópolis' },
  { d:'06/08', mes:'Agosto', p:'Soleide Ribeiro', tel:'47999008004', idade:47, canal:'Indicação', cidade:'Blumenau' },
  { d:'07/08', mes:'Agosto', p:'Taynara Teixeira', tel:'47999008005', idade:27, canal:'Instagram', cidade:'Joinville' },
  { d:'08/08', mes:'Agosto', p:'Uiara Machado', tel:'47999008006', idade:36, canal:'Google', cidade:'Blumenau' },
  { d:'11/08', mes:'Agosto', p:'Valmira Oliveira', tel:'47999008007', idade:44, canal:'Instagram', cidade:'Itajaí' },
  { d:'12/08', mes:'Agosto', p:'Walquiria Becker', tel:'47999008008', idade:32, canal:'Indicação', cidade:'Florianópolis' },
  { d:'13/08', mes:'Agosto', p:'Xanda Lima', tel:'47999008009', idade:39, canal:'TikTok', cidade:'Blumenau' },
  { d:'14/08', mes:'Agosto', p:'Ylana Alves', tel:'47999008010', idade:46, canal:'Instagram', cidade:'Joinville' },
];

// -------------------------------------------------------
// 2026 CONSULTATIONS (60+ entries)
// -------------------------------------------------------
export const cons26_lista: Consultation[] = [
  { d:'02/01', mes:'Janeiro', p:'Zadia Nunes', tel:'47999100001', idade:35, canal:'Instagram', cidade:'Blumenau' },
  { d:'05/01', mes:'Janeiro', p:'Amalia Moraes', tel:'47999100002', idade:29, canal:'Google', cidade:'Joinville' },
  { d:'06/01', mes:'Janeiro', p:'Brenda Costa', tel:'47999100003', idade:42, canal:'Instagram', cidade:'Florianópolis' },
  { d:'07/01', mes:'Janeiro', p:'Cristiane Dias', tel:'47999100004', idade:37, canal:'Indicação', cidade:'Blumenau' },
  { d:'08/01', mes:'Janeiro', p:'Daiane Pinto', tel:'47999100005', idade:31, canal:'TikTok', cidade:'Itajaí' },
  { d:'09/01', mes:'Janeiro', p:'Emilene Souza', tel:'47999100006', idade:44, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'12/01', mes:'Janeiro', p:'Fabiana Barbosa', tel:'47999100007', idade:28, canal:'Google', cidade:'Blumenau' },
  { d:'13/01', mes:'Janeiro', p:'Georgia Cruz', tel:'47999100008', idade:40, canal:'Instagram', cidade:'Joinville' },
  { d:'14/01', mes:'Janeiro', p:'Hanna Freitas', tel:'47999100009', idade:33, canal:'Indicação', cidade:'Florianópolis' },
  { d:'15/01', mes:'Janeiro', p:'Ingrid Medeiros', tel:'47999100010', idade:48, canal:'Instagram', cidade:'Blumenau' },
  { d:'16/01', mes:'Janeiro', p:'Josimare Bezerra', tel:'47999100011', idade:26, canal:'TikTok', cidade:'Itajaí' },
  { d:'19/01', mes:'Janeiro', p:'Karla Carvalho', tel:'47999100012', idade:38, canal:'Google', cidade:'Balneário Camboriú' },
  { d:'20/01', mes:'Janeiro', p:'Layse Ferreira', tel:'47999100013', idade:43, canal:'Instagram', cidade:'Blumenau' },
  { d:'21/01', mes:'Janeiro', p:'Mayara Ribeiro', tel:'47999100014', idade:32, canal:'Indicação', cidade:'Joinville' },
  { d:'22/01', mes:'Janeiro', p:'Nubia Teixeira', tel:'47999100015', idade:47, canal:'Instagram', cidade:'Florianópolis' },
  { d:'23/01', mes:'Janeiro', p:'Olimpia Machado', tel:'47999100016', idade:30, canal:'Google', cidade:'Blumenau' },
  { d:'26/01', mes:'Janeiro', p:'Poliana Oliveira', tel:'47999100017', idade:36, canal:'TikTok', cidade:'Itajaí' },
  { d:'27/01', mes:'Janeiro', p:'Quezia Becker', tel:'47999100018', idade:41, canal:'Instagram', cidade:'Joinville' },
  { d:'28/01', mes:'Janeiro', p:'Rosimeire Lima', tel:'47999100019', idade:27, canal:'Indicação', cidade:'Blumenau' },
  { d:'29/01', mes:'Janeiro', p:'Salete Alves', tel:'47999100020', idade:45, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'30/01', mes:'Janeiro', p:'Tanara Nunes', tel:'47999100021', idade:34, canal:'Google', cidade:'Florianópolis' },
  { d:'02/02', mes:'Fevereiro', p:'Ualete Moraes', tel:'47999100022', idade:39, canal:'Instagram', cidade:'Blumenau' },
  { d:'03/02', mes:'Fevereiro', p:'Valdirene Costa', tel:'47999100023', idade:28, canal:'TikTok', cidade:'Joinville' },
  { d:'04/02', mes:'Fevereiro', p:'Wanderlea Dias', tel:'47999100024', idade:44, canal:'Indicação', cidade:'Blumenau' },
  { d:'05/02', mes:'Fevereiro', p:'Xandrinha Pinto', tel:'47999100025', idade:31, canal:'Instagram', cidade:'Itajaí' },
  { d:'06/02', mes:'Fevereiro', p:'Yolanda Souza', tel:'47999100026', idade:37, canal:'Google', cidade:'Florianópolis' },
  { d:'09/02', mes:'Fevereiro', p:'Zarinha Barbosa', tel:'47999100027', idade:43, canal:'Instagram', cidade:'Blumenau' },
  { d:'10/02', mes:'Fevereiro', p:'Areta Cruz', tel:'47999100028', idade:29, canal:'Indicação', cidade:'Joinville' },
  { d:'11/02', mes:'Fevereiro', p:'Belinha Freitas', tel:'47999100029', idade:46, canal:'TikTok', cidade:'Blumenau' },
  { d:'12/02', mes:'Fevereiro', p:'Celenita Medeiros', tel:'47999100030', idade:32, canal:'Instagram', cidade:'Itajaí' },
  { d:'13/02', mes:'Fevereiro', p:'Dinalva Bezerra', tel:'47999100031', idade:38, canal:'Google', cidade:'Balneário Camboriú' },
  { d:'16/02', mes:'Fevereiro', p:'Ednalva Carvalho', tel:'47999100032', idade:42, canal:'Instagram', cidade:'Florianópolis' },
  { d:'17/02', mes:'Fevereiro', p:'Filinha Ferreira', tel:'47999100033', idade:27, canal:'Indicação', cidade:'Blumenau' },
  { d:'18/02', mes:'Fevereiro', p:'Geralda Ribeiro', tel:'47999100034', idade:47, canal:'Instagram', cidade:'Joinville' },
  { d:'19/02', mes:'Fevereiro', p:'Hortencia Teixeira', tel:'47999100035', idade:33, canal:'TikTok', cidade:'Blumenau' },
  { d:'20/02', mes:'Fevereiro', p:'Iranilda Machado', tel:'47999100036', idade:40, canal:'Google', cidade:'Itajaí' },
  { d:'23/02', mes:'Fevereiro', p:'Jandyra Oliveira', tel:'47999100037', idade:35, canal:'Instagram', cidade:'Florianópolis' },
  { d:'24/02', mes:'Fevereiro', p:'Keity Becker', tel:'47999100038', idade:48, canal:'Indicação', cidade:'Blumenau' },
  { d:'25/02', mes:'Fevereiro', p:'Lenilda Lima', tel:'47999100039', idade:26, canal:'Instagram', cidade:'Joinville' },
  { d:'26/02', mes:'Fevereiro', p:'Macilene Alves', tel:'47999100040', idade:41, canal:'Google', cidade:'Blumenau' },
  { d:'27/02', mes:'Fevereiro', p:'Nazinete Nunes', tel:'47999100041', idade:36, canal:'TikTok', cidade:'Itajaí' },
  { d:'02/03', mes:'Março', p:'Odailza Moraes', tel:'47999100042', idade:44, canal:'Instagram', cidade:'Balneário Camboriú' },
  { d:'03/03', mes:'Março', p:'Pamela Costa', tel:'47999100043', idade:30, canal:'Indicação', cidade:'Florianópolis' },
  { d:'04/03', mes:'Março', p:'Quiteria Dias', tel:'47999100044', idade:38, canal:'Instagram', cidade:'Blumenau' },
  { d:'05/03', mes:'Março', p:'Regilene Pinto', tel:'47999100045', idade:43, canal:'Google', cidade:'Joinville' },
  { d:'06/03', mes:'Março', p:'Silvana Souza', tel:'47999100046', idade:29, canal:'Instagram', cidade:'Blumenau' },
  { d:'09/03', mes:'Março', p:'Tamires Barbosa', tel:'47999100047', idade:37, canal:'TikTok', cidade:'Itajaí' },
  { d:'10/03', mes:'Março', p:'Ursula Cruz', tel:'47999100048', idade:46, canal:'Indicação', cidade:'Florianópolis' },
  { d:'11/03', mes:'Março', p:'Valdircia Freitas', tel:'47999100049', idade:32, canal:'Instagram', cidade:'Blumenau' },
  { d:'12/03', mes:'Março', p:'Waleska Medeiros', tel:'47999100050', idade:39, canal:'Google', cidade:'Joinville' },
  { d:'13/03', mes:'Março', p:'Xena Bezerra', tel:'47999100051', idade:27, canal:'Instagram', cidade:'Blumenau' },
  { d:'16/03', mes:'Março', p:'Yolle Carvalho', tel:'47999100052', idade:44, canal:'Indicação', cidade:'Itajaí' },
  { d:'17/03', mes:'Março', p:'Zulma Ferreira', tel:'47999100053', idade:31, canal:'TikTok', cidade:'Balneário Camboriú' },
  { d:'18/03', mes:'Março', p:'Adamaris Ribeiro', tel:'47999100054', idade:47, canal:'Instagram', cidade:'Florianópolis' },
  { d:'19/03', mes:'Março', p:'Bertolina Teixeira', tel:'47999100055', idade:35, canal:'Google', cidade:'Blumenau' },
  { d:'20/03', mes:'Março', p:'Cirlene Machado', tel:'47999100056', idade:41, canal:'Instagram', cidade:'Joinville' },
  { d:'23/03', mes:'Março', p:'Detinha Oliveira', tel:'47999100057', idade:28, canal:'Indicação', cidade:'Blumenau' },
  { d:'24/03', mes:'Março', p:'Erismar Becker', tel:'47999100058', idade:45, canal:'Instagram', cidade:'Itajaí' },
  { d:'25/03', mes:'Março', p:'Flozinha Lima', tel:'47999100059', idade:33, canal:'TikTok', cidade:'Florianópolis' },
  { d:'26/03', mes:'Março', p:'Genilda Alves', tel:'47999100060', idade:40, canal:'Google', cidade:'Blumenau' },
  { d:'27/03', mes:'Março', p:'Heloina Nunes', tel:'47999100061', idade:36, canal:'Instagram', cidade:'Joinville' },
  { d:'30/03', mes:'Março', p:'Igara Moraes', tel:'47999100062', idade:43, canal:'Indicação', cidade:'Blumenau' },
  { d:'31/03', mes:'Março', p:'Janusa Costa', tel:'47999100063', idade:29, canal:'Instagram', cidade:'Itajaí' },
  { d:'01/04', mes:'Abril', p:'Kezia Dias', tel:'47999100064', idade:37, canal:'Google', cidade:'Balneário Camboriú' },
  { d:'02/04', mes:'Abril', p:'Lorena Pinto', tel:'47999100065', idade:42, canal:'TikTok', cidade:'Florianópolis' },
  { d:'03/04', mes:'Abril', p:'Mercia Souza', tel:'47999100066', idade:26, canal:'Instagram', cidade:'Blumenau' },
  { d:'06/04', mes:'Abril', p:'Nadja Barbosa', tel:'47999100067', idade:48, canal:'Indicação', cidade:'Joinville' },
  { d:'07/04', mes:'Abril', p:'Odete Cruz', tel:'47999100068', idade:34, canal:'Instagram', cidade:'Blumenau' },
  { d:'08/04', mes:'Abril', p:'Pamela Freitas', tel:'47999100069', idade:39, canal:'Google', cidade:'Itajaí' },
  { d:'09/04', mes:'Abril', p:'Quinta Medeiros', tel:'47999100070', idade:44, canal:'Instagram', cidade:'Florianópolis' },
];

// -------------------------------------------------------
// CANAL STATS 2025
// -------------------------------------------------------
export const canal25: CanalStat[] = [
  { canal: 'Instagram', count: 82, pct: 51.3 },
  { canal: 'Indicação', count: 41, pct: 25.6 },
  { canal: 'Google', count: 25, pct: 15.6 },
  { canal: 'TikTok', count: 12, pct: 7.5 },
];

// -------------------------------------------------------
// CANAL STATS 2026
// -------------------------------------------------------
export const canal26: CanalStat[] = [
  { canal: 'Instagram', count: 36, pct: 51.4 },
  { canal: 'Indicação', count: 18, pct: 25.7 },
  { canal: 'Google', count: 10, pct: 14.3 },
  { canal: 'TikTok', count: 6, pct: 8.6 },
];

// -------------------------------------------------------
// AGE BRACKET STATS 2025
// -------------------------------------------------------
export const age25: AgeStat[] = [
  { faixa: '18-25', count: 8, pct: 5.0 },
  { faixa: '26-30', count: 28, pct: 17.5 },
  { faixa: '31-35', count: 38, pct: 23.8 },
  { faixa: '36-40', count: 36, pct: 22.5 },
  { faixa: '41-45', count: 30, pct: 18.8 },
  { faixa: '46-50', count: 16, pct: 10.0 },
  { faixa: '51+', count: 4, pct: 2.5 },
];

// -------------------------------------------------------
// AGE BRACKET STATS 2026
// -------------------------------------------------------
export const age26: AgeStat[] = [
  { faixa: '18-25', count: 3, pct: 4.3 },
  { faixa: '26-30', count: 12, pct: 17.1 },
  { faixa: '31-35', count: 17, pct: 24.3 },
  { faixa: '36-40', count: 16, pct: 22.9 },
  { faixa: '41-45', count: 13, pct: 18.6 },
  { faixa: '46-50', count: 7, pct: 10.0 },
  { faixa: '51+', count: 2, pct: 2.9 },
];

// -------------------------------------------------------
// CITY STATS 2025
// -------------------------------------------------------
export const city25: { cidade: string; count: number }[] = [
  { cidade: 'Blumenau', count: 58 },
  { cidade: 'Joinville', count: 32 },
  { cidade: 'Florianópolis', count: 28 },
  { cidade: 'Itajaí', count: 18 },
  { cidade: 'Balneário Camboriú', count: 14 },
  { cidade: 'Brusque', count: 5 },
  { cidade: 'Gaspar', count: 3 },
  { cidade: 'Outros SC', count: 2 },
];

// -------------------------------------------------------
// CITY STATS 2026
// -------------------------------------------------------
export const city26: { cidade: string; count: number }[] = [
  { cidade: 'Blumenau', count: 26 },
  { cidade: 'Joinville', count: 14 },
  { cidade: 'Florianópolis', count: 12 },
  { cidade: 'Itajaí', count: 8 },
  { cidade: 'Balneário Camboriú', count: 6 },
  { cidade: 'Brusque', count: 2 },
  { cidade: 'Outros SC', count: 2 },
];

// -------------------------------------------------------
// INTERNATIONAL STATS 2025
// -------------------------------------------------------
export const intl25: IntlStat[] = [
  { pais: 'Argentina', count: 3 },
  { pais: 'EUA', count: 2 },
  { pais: 'Portugal', count: 1 },
];

// -------------------------------------------------------
// INTERNATIONAL STATS 2026
// -------------------------------------------------------
export const intl26: IntlStat[] = [
  { pais: 'Argentina', count: 2 },
  { pais: 'EUA', count: 1 },
];

// -------------------------------------------------------
// ORC STATS 2025
// -------------------------------------------------------
export const orc25: OrcStats = {
  total: 160,
  aceitos: 57,
  pendentes: 18,
  recusados: 85,
  valorTotal: 2560000,
  valorAceito: 912000,
};

// -------------------------------------------------------
// ORC STATS 2026
// -------------------------------------------------------
export const orc26: OrcStats = {
  total: 70,
  aceitos: 15,
  pendentes: 22,
  recusados: 33,
  valorTotal: 1120000,
  valorAceito: 277000,
};
