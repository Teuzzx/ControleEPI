# Ambiente de desenvolvimento — Controle de EPI

Instalado nesta máquina em 13/10/2026. Estas vars já estão gravadas no perfil
do usuário do Windows (`JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT`, PATH),
então novos terminais já pegam. Shell antigo precisa recarregar.

## Ferramentas

| Ferramenta | Caminho | Versão |
|---|---|---|
| Flutter SDK | `C:\src\flutter\bin\flutter.bat` | 3.47.7 (Dart 3.13.5) |
| JDK | `C:\src\jdk-17.0.20.1+1` | Temurin OpenJDK 17.0.20.1 |
| Android SDK | `C:\Users\Mateus Santos\AppData\Local\Android\Sdk` | build-tools 34/36/37, platforms 35 e 36.1 |
| Git | `C:\Program Files\Git\cmd\git.exe` | do sistema |
| Node | `C:\Program Files\nodejs` | v24.16.0 |

## Por que o JDK foi instalado

O `java` do PATH era **1.8** (stub do Oracle em `Common Files\Oracle\Java\java8path`).
O Gradle 9.1.0 que o projeto usa — e o próprio Flutter — exigem **JDK 17+**.
O Gradle do projeto está em `mobile/android/gradle/wrapper/gradle-wrapper.properties`.

O PATH do sistema continua apontando pro Java 1.8. Se um build falhar com
`Unsupported class file major version`, é isso — o Flutter precisa achar o JDK
17 primeiro no PATH.

## Como rodar

```powershell
cd "F:\CONTROLE EPI\ControleEPI-master\mobile"

# Se o shell ainda mostra java 1.8, force o JDK 17 na sessao:
$env:JAVA_HOME = 'C:\src\jdk-17.0.20.1+1'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

flutter pub get
flutter analyze
flutter test
flutter build apk --release
```

## Permissões

Só o escopo **User** do registro pode ser escrito (sem admin). Não dá para
gravar em `Machine`. Se algo precisar ser alterado em nível de máquina, tem
que ser feito manualmente pelo painel do Windows.

## Pendente conhecido

A Filial São Paulo está sem `supabase_url` em `companies`, então a tela de
Distribuição não consegue enviar estoque para ela.